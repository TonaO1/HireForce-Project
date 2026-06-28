import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import type { PointerEvent as ReactPointerEvent, ReactNode } from 'react';

interface Body {
  id: string;
  x: number;
  y: number;
  homeX: number;
  homeY: number;
  jx: number;
  jy: number;
  scale: number;
  targetScale: number;
  dragging: boolean;
  node: HTMLDivElement | null;
}

interface InteractiveCanvasProps<T extends { id: string }> {
  items: T[];
  renderCard: (item: T, state: { selected: boolean }) => ReactNode;
  cardWidth?: number;
  cardHeight?: number;
}

const PAD = 14;
const PASSES = 6;
const SELECTED_SCALE = 1.5;
const SCATTER_SCALE = 0.72;
const DRAG_THRESHOLD = 4;
const SCALE_LERP = 0.18;
// Re-layout easing: only used during explicit scatter / gather / reset, never
// during or after a drag, so dragged-aside cards are displaced permanently.
const SEEK_LERP = 0.16;
const SEEK_FRAMES = 48;

// Separate two cards along one axis. A dragged card is immovable so neighbours
// flow around it; otherwise the correction is shared between both cards.
function applyPush(a: Body, b: Body, px: number, py: number) {
  const aMov = !a.dragging;
  const bMov = !b.dragging;
  if (aMov && bMov) {
    a.x -= px / 2;
    a.y -= py / 2;
    b.x += px / 2;
    b.y += py / 2;
  } else if (bMov) {
    b.x += px;
    b.y += py;
  } else if (aMov) {
    a.x -= px;
    a.y -= py;
  }
}

export function InteractiveCanvas<T extends { id: string }>({
  items,
  renderCard,
  cardWidth = 250,
  cardHeight = 172,
}: InteractiveCanvasProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<HTMLDivElement>(null);
  const bodiesRef = useRef<Body[]>([]);
  const bodyMapRef = useRef<Map<string, Body>>(new Map());
  const refSettersRef = useRef<Map<string, (el: HTMLDivElement | null) => void>>(
    new Map(),
  );
  const panRef = useRef({ x: 0, y: 0 });
  const rectRef = useRef({ left: 0, top: 0, width: 0, height: 0 });
  const rafRef = useRef(0);
  const runningRef = useRef(false);
  const panInitRef = useRef(false);
  const draggingRef = useRef(false);
  const seekFramesRef = useRef(0);
  const dragTargetRef = useRef<{ id: string; x: number; y: number } | null>(null);

  const bgDragRef = useRef<{
    startX: number;
    startY: number;
    panX: number;
    panY: number;
    moved: boolean;
  } | null>(null);
  const cardDragRef = useRef<{
    id: string;
    grabDX: number;
    grabDY: number;
    startX: number;
    startY: number;
    moved: boolean;
  } | null>(null);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [scatter, setScatter] = useState(false);
  const prevScatterRef = useRef(scatter);

  const itemsKey = items.map((i) => i.id).join('|');

  const applyPan = useCallback(() => {
    if (worldRef.current) {
      worldRef.current.style.transform = `translate(${panRef.current.x}px, ${panRef.current.y}px)`;
    }
  }, []);

  const writeOne = useCallback((b: Body) => {
    const node = b.node;
    if (!node) return;
    node.style.transform = `translate(${b.x}px, ${b.y}px) translate(-50%, -50%) scale(${b.scale.toFixed(3)})`;
    node.style.zIndex = b.dragging
      ? '1000'
      : b.targetScale === SELECTED_SCALE
        ? '50'
        : '1';
  }, []);

  const writeAll = useCallback(() => {
    for (const b of bodiesRef.current) writeOne(b);
  }, [writeOne]);

  const computeHomes = useCallback(() => {
    const bodies = bodiesRef.current;
    const n = bodies.length;
    if (n === 0) return;
    const cols = Math.max(1, Math.ceil(Math.sqrt(n)));
    const rows = Math.ceil(n / cols);
    const gapX = (scatter ? 1.7 : 1.12) * cardWidth + 64;
    const gapY = (scatter ? 1.7 : 1.12) * cardHeight + 64;
    bodies.forEach((b, i) => {
      const c = i % cols;
      const r = Math.floor(i / cols);
      b.homeX = (c - (cols - 1) / 2) * gapX + (scatter ? b.jx : 0);
      b.homeY = (r - (rows - 1) / 2) * gapY + (scatter ? b.jy : 0);
    });
  }, [scatter, cardWidth, cardHeight]);

  const applyTargets = useCallback(() => {
    for (const b of bodiesRef.current) {
      b.targetScale = selected.has(b.id)
        ? SELECTED_SCALE
        : scatter
          ? SCATTER_SCALE
          : 1;
    }
  }, [selected, scatter]);

  // One physics step. Returns true while anything is still in motion.
  const simulate = useCallback(() => {
    const bodies = bodiesRef.current;
    let moving = false;

    // Drive the dragged card straight to the pointer target for zero lag.
    const target = dragTargetRef.current;
    if (target) {
      const b = bodyMapRef.current.get(target.id);
      if (b) {
        b.x = target.x;
        b.y = target.y;
      }
    }

    // Ease cards toward the layout ONLY during an explicit re-layout window
    // (mount, scatter/gather, reset). Outside it there is no home attraction,
    // so cards pushed aside by a drag stay exactly where they were left.
    if (seekFramesRef.current > 0) {
      for (const b of bodies) {
        if (b.dragging) continue;
        b.x += (b.homeX - b.x) * SEEK_LERP;
        b.y += (b.homeY - b.y) * SEEK_LERP;
      }
      seekFramesRef.current -= 1;
      moving = true;
    }

    // Ease scale (selection / scatter) without pulling cards back home.
    for (const b of bodies) {
      const ds = b.targetScale - b.scale;
      if (Math.abs(ds) > 0.004) {
        b.scale += ds * SCALE_LERP;
        moving = true;
      } else {
        b.scale = b.targetScale;
      }
    }

    // Continuous separation (several relaxation passes) so cards never overlap.
    for (let pass = 0; pass < PASSES; pass++) {
      for (let i = 0; i < bodies.length; i++) {
        for (let j = i + 1; j < bodies.length; j++) {
          const a = bodies[i];
          const b = bodies[j];
          const minX = (cardWidth * a.scale) / 2 + (cardWidth * b.scale) / 2 + PAD;
          const minY = (cardHeight * a.scale) / 2 + (cardHeight * b.scale) / 2 + PAD;
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const ox = minX - Math.abs(dx);
          const oy = minY - Math.abs(dy);
          if (ox > 0 && oy > 0) {
            if (ox < oy) applyPush(a, b, dx < 0 ? -ox : ox, 0);
            else applyPush(a, b, 0, dy < 0 ? -oy : oy);
            moving = true;
          }
        }
      }
    }

    return moving;
  }, [cardWidth, cardHeight]);

  const tick = useCallback(() => {
    const moving = simulate();
    writeAll();
    // Keep running while dragging so the drag updates every single frame.
    if (moving || draggingRef.current) {
      rafRef.current = requestAnimationFrame(tick);
    } else {
      for (const b of bodiesRef.current) b.scale = b.targetScale;
      writeAll();
      runningRef.current = false;
    }
  }, [simulate, writeAll]);

  const ensureRunning = useCallback(() => {
    if (!runningRef.current) {
      runningRef.current = true;
      rafRef.current = requestAnimationFrame(tick);
    }
  }, [tick]);

  // Stable per-id ref callback (avoids re-attaching nodes on every render).
  const getRefSetter = useCallback(
    (id: string) => {
      let fn = refSettersRef.current.get(id);
      if (!fn) {
        fn = (el: HTMLDivElement | null) => {
          const b = bodyMapRef.current.get(id);
          if (b) {
            b.node = el;
            if (el) writeOne(b);
          }
        };
        refSettersRef.current.set(id, fn);
      }
      return fn;
    },
    [writeOne],
  );

  // Build / reconcile physics bodies when the item set changes.
  useLayoutEffect(() => {
    const map = bodyMapRef.current;
    const next: Body[] = [];
    const seen = new Set<string>();
    for (const it of items) {
      seen.add(it.id);
      let b = map.get(it.id);
      if (!b) {
        b = {
          id: it.id,
          x: (Math.random() - 0.5) * 80,
          y: (Math.random() - 0.5) * 80,
          homeX: 0,
          homeY: 0,
          jx: (Math.random() - 0.5) * 180,
          jy: (Math.random() - 0.5) * 180,
          scale: 0.6,
          targetScale: 1,
          dragging: false,
          node: null,
        };
        map.set(it.id, b);
      }
      next.push(b);
    }
    for (const id of [...map.keys()]) {
      if (!seen.has(id)) {
        map.delete(id);
        refSettersRef.current.delete(id);
      }
    }
    bodiesRef.current = next;
    applyTargets();
    computeHomes();
    seekFramesRef.current = SEEK_FRAMES; // animate the new set into its layout
    writeAll();
    ensureRunning();
  }, [itemsKey, items, applyTargets, computeHomes, writeAll, ensureRunning]);

  // Selection just rescales the card (neighbours are displaced by collision and
  // stay put). Only an explicit scatter / gather toggle triggers a re-layout
  // back toward home positions.
  useEffect(() => {
    applyTargets();
    computeHomes();
    if (prevScatterRef.current !== scatter) {
      prevScatterRef.current = scatter;
      seekFramesRef.current = SEEK_FRAMES;
    }
    ensureRunning();
  }, [selected, scatter, applyTargets, computeHomes, ensureRunning]);

  // Single persistent loop; cleanup cancels AND resets the flag (StrictMode-safe).
  useEffect(() => {
    ensureRunning();
    return () => {
      cancelAnimationFrame(rafRef.current);
      runningRef.current = false;
    };
  }, [ensureRunning]);

  // Measure + center the world once; keep rect fresh on resize.
  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const measure = () => {
      const r = el.getBoundingClientRect();
      rectRef.current = { left: r.left, top: r.top, width: r.width, height: r.height };
      if (!panInitRef.current) {
        panRef.current = { x: r.width / 2, y: r.height / 2 };
        panInitRef.current = true;
        applyPan();
      }
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [applyPan]);

  // Wheel / trackpad panning (infinite-canvas feel).
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      panRef.current.x -= e.deltaX;
      panRef.current.y -= e.deltaY;
      applyPan();
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [applyPan]);

  const onPointerDown = (e: ReactPointerEvent) => {
    const container = containerRef.current;
    if (!container) return;
    const target = e.target as HTMLElement;
    const r = container.getBoundingClientRect();
    rectRef.current = { left: r.left, top: r.top, width: r.width, height: r.height };

    const cardEl = target.closest('[data-card-id]') as HTMLElement | null;
    if (cardEl) {
      if (target.closest('[data-no-drag]')) return; // let buttons receive the click
      const id = cardEl.dataset.cardId;
      const b = id ? bodyMapRef.current.get(id) : undefined;
      if (!b || !id) return;
      const worldX = e.clientX - r.left - panRef.current.x;
      const worldY = e.clientY - r.top - panRef.current.y;
      cardDragRef.current = {
        id,
        grabDX: worldX - b.x,
        grabDY: worldY - b.y,
        startX: e.clientX,
        startY: e.clientY,
        moved: false,
      };
    } else {
      bgDragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        panX: panRef.current.x,
        panY: panRef.current.y,
        moved: false,
      };
    }
    container.setPointerCapture(e.pointerId);
    ensureRunning();
  };

  const onPointerMove = (e: ReactPointerEvent) => {
    const cd = cardDragRef.current;
    const bg = bgDragRef.current;
    if (cd) {
      if (
        !cd.moved &&
        Math.hypot(e.clientX - cd.startX, e.clientY - cd.startY) > DRAG_THRESHOLD
      ) {
        cd.moved = true;
        draggingRef.current = true;
        seekFramesRef.current = 0; // cancel any in-progress re-layout
        const b = bodyMapRef.current.get(cd.id);
        if (b) b.dragging = true;
        ensureRunning();
      }
      if (cd.moved) {
        // Only update a ref; the rAF loop consumes it every frame (no re-render).
        dragTargetRef.current = {
          id: cd.id,
          x: e.clientX - rectRef.current.left - panRef.current.x - cd.grabDX,
          y: e.clientY - rectRef.current.top - panRef.current.y - cd.grabDY,
        };
      }
    } else if (bg) {
      const dx = e.clientX - bg.startX;
      const dy = e.clientY - bg.startY;
      if (!bg.moved && Math.hypot(dx, dy) > DRAG_THRESHOLD) bg.moved = true;
      if (bg.moved) {
        panRef.current.x = bg.panX + dx;
        panRef.current.y = bg.panY + dy;
        applyPan();
      }
    }
  };

  const onPointerUp = (e: ReactPointerEvent) => {
    const cd = cardDragRef.current;
    const bg = bgDragRef.current;
    if (cd) {
      const b = bodyMapRef.current.get(cd.id);
      if (!cd.moved) {
        setSelected((prev) => {
          const next = new Set(prev);
          if (e.shiftKey) {
            if (next.has(cd.id)) next.delete(cd.id);
            else next.add(cd.id);
          } else if (next.size === 1 && next.has(cd.id)) {
            next.clear();
          } else {
            next.clear();
            next.add(cd.id);
          }
          return next;
        });
      } else if (b) {
        b.dragging = false; // stays where it was dropped (no spring-back)
      }
      draggingRef.current = false;
      dragTargetRef.current = null;
      cardDragRef.current = null;
      ensureRunning();
    } else if (bg) {
      if (!bg.moved) {
        setScatter((s) => !s);
        setSelected(new Set());
      }
      bgDragRef.current = null;
    }
    try {
      containerRef.current?.releasePointerCapture(e.pointerId);
    } catch {
      /* pointer already released */
    }
  };

  return (
    <div
      ref={containerRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      className="relative h-full w-full touch-none select-none overflow-hidden bg-black"
    >
      <div ref={worldRef} className="absolute left-0 top-0 h-0 w-0">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -z-10"
          style={{
            left: -3000,
            top: -3000,
            width: 6000,
            height: 6000,
            backgroundImage:
              'linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
        {items.map((it) => {
          const isSel = selected.has(it.id);
          return (
            <div
              key={it.id}
              data-card-id={it.id}
              ref={getRefSetter(it.id)}
              style={{ width: cardWidth, height: cardHeight }}
              className={`absolute left-0 top-0 cursor-grab overflow-hidden rounded-xl border bg-black shadow-[0_0_40px_rgba(0,0,0,0.6)] transition-[border-color,box-shadow] duration-200 will-change-transform active:cursor-grabbing ${
                isSel
                  ? 'border-white shadow-[0_0_30px_rgba(255,255,255,0.12)]'
                  : 'border-white/25 hover:border-white/50'
              }`}
            >
              {renderCard(it, { selected: isSel })}
            </div>
          );
        })}
      </div>

      <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.25em] text-white/30">
        drag · scroll · click empty to {scatter ? 'gather' : 'scatter'} · shift+click multi-select
      </div>
    </div>
  );
}
