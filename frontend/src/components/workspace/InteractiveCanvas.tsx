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
  vx: number;
  vy: number;
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

const SPRING = 0.06;
const DAMP = 0.85;
const PAD = 16;
const SELECTED_SCALE = 1.5;
const SCATTER_SCALE = 0.72;
const DRAG_THRESHOLD = 4;

// Push two cards apart along a single axis. A dragged card is immovable so its
// neighbours flow around it; otherwise the correction is split between both.
function resolve(a: Body, b: Body, px: number, py: number) {
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
  const panRef = useRef({ x: 0, y: 0 });
  const rectRef = useRef({ left: 0, top: 0, width: 0, height: 0 });
  const rafRef = useRef(0);
  const runningRef = useRef(false);
  const panInitRef = useRef(false);

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

  const itemsKey = items.map((i) => i.id).join('|');

  const applyPan = useCallback(() => {
    if (worldRef.current) {
      worldRef.current.style.transform = `translate(${panRef.current.x}px, ${panRef.current.y}px)`;
    }
  }, []);

  const writeTransforms = useCallback(() => {
    for (const b of bodiesRef.current) {
      if (b.node) {
        b.node.style.transform = `translate(${b.x}px, ${b.y}px) translate(-50%, -50%) scale(${b.scale.toFixed(3)})`;
      }
    }
  }, []);

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

  const step = useCallback(() => {
    const bodies = bodiesRef.current;
    let active = false;

    for (const b of bodies) {
      if (!b.dragging) {
        b.vx = (b.vx + (b.homeX - b.x) * SPRING) * DAMP;
        b.vy = (b.vy + (b.homeY - b.y) * SPRING) * DAMP;
        b.x += b.vx;
        b.y += b.vy;
        if (Math.abs(b.vx) + Math.abs(b.vy) > 0.05) active = true;
      }
      const ds = b.targetScale - b.scale;
      b.scale += ds * 0.18;
      if (Math.abs(ds) > 0.004) active = true;
    }

    // Lightweight AABB separation (two relaxation passes) prevents overlap.
    for (let iter = 0; iter < 2; iter++) {
      for (let i = 0; i < bodies.length; i++) {
        for (let j = i + 1; j < bodies.length; j++) {
          const a = bodies[i];
          const b = bodies[j];
          const halfW = (cardWidth * a.scale) / 2 + (cardWidth * b.scale) / 2 + PAD * 2;
          const halfH = (cardHeight * a.scale) / 2 + (cardHeight * b.scale) / 2 + PAD * 2;
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const ox = halfW - Math.abs(dx);
          const oy = halfH - Math.abs(dy);
          if (ox > 0 && oy > 0) {
            if (ox < oy) resolve(a, b, dx < 0 ? -ox : ox, 0);
            else resolve(a, b, 0, dy < 0 ? -oy : oy);
            active = true;
          }
        }
      }
    }

    writeTransforms();

    if (active) {
      rafRef.current = requestAnimationFrame(step);
    } else {
      for (const b of bodies) b.scale = b.targetScale;
      writeTransforms();
      runningRef.current = false;
    }
  }, [cardWidth, cardHeight, writeTransforms]);

  const kick = useCallback(() => {
    if (!runningRef.current) {
      runningRef.current = true;
      rafRef.current = requestAnimationFrame(step);
    }
  }, [step]);

  const applyTargets = useCallback(() => {
    for (const b of bodiesRef.current) {
      b.targetScale = selected.has(b.id)
        ? SELECTED_SCALE
        : scatter
          ? SCATTER_SCALE
          : 1;
    }
  }, [selected, scatter]);

  const registerNode = useCallback((id: string, el: HTMLDivElement | null) => {
    const b = bodyMapRef.current.get(id);
    if (b) {
      b.node = el;
      if (el) {
        el.style.transform = `translate(${b.x}px, ${b.y}px) translate(-50%, -50%) scale(${b.scale.toFixed(3)})`;
      }
    }
  }, []);

  // Build / reconcile physics bodies whenever the item set changes.
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
          vx: 0,
          vy: 0,
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
    for (const id of [...map.keys()]) if (!seen.has(id)) map.delete(id);
    bodiesRef.current = next;
    applyTargets();
    computeHomes();
    writeTransforms();
    kick();
  }, [itemsKey, applyTargets, computeHomes, writeTransforms, kick, items]);

  // Re-target scale + home positions when selection or scatter mode changes.
  useEffect(() => {
    applyTargets();
    computeHomes();
    kick();
  }, [applyTargets, computeHomes, kick]);

  // Measure container and center the world once; keep rect fresh on resize.
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

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  // Wheel / trackpad panning (infinite canvas feel).
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
  };

  const onPointerMove = (e: ReactPointerEvent) => {
    const cd = cardDragRef.current;
    const bg = bgDragRef.current;
    if (cd) {
      if (!cd.moved && Math.hypot(e.clientX - cd.startX, e.clientY - cd.startY) > DRAG_THRESHOLD) {
        cd.moved = true;
        const b = bodyMapRef.current.get(cd.id);
        if (b) {
          b.dragging = true;
          if (b.node) b.node.style.zIndex = '100';
        }
      }
      if (cd.moved) {
        const b = bodyMapRef.current.get(cd.id);
        if (b) {
          b.x = e.clientX - rectRef.current.left - panRef.current.x - cd.grabDX;
          b.y = e.clientY - rectRef.current.top - panRef.current.y - cd.grabDY;
          b.vx = 0;
          b.vy = 0;
          kick();
        }
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
        b.dragging = false;
        if (b.node) b.node.style.zIndex = selected.has(b.id) ? '50' : '1';
        kick();
      }
      cardDragRef.current = null;
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
              ref={(el) => registerNode(it.id, el)}
              style={{ width: cardWidth, height: cardHeight, zIndex: isSel ? 50 : 1 }}
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
