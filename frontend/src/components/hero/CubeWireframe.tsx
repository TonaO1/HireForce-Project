import { useEffect, useRef } from 'react';

interface CubeWireframeProps {
  className?: string;
  /** Primary spin speed in radians per second. */
  speed?: number;
}

// Unit cube centered on the origin (vertices from -1 to 1).
const VERTICES: readonly [number, number, number][] = [
  [-1, -1, -1],
  [1, -1, -1],
  [1, 1, -1],
  [-1, 1, -1],
  [-1, -1, 1],
  [1, -1, 1],
  [1, 1, 1],
  [-1, 1, 1],
];

// 12 edges referencing vertex indices (back face, front face, connectors).
const EDGES: readonly [number, number][] = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 0],
  [4, 5],
  [5, 6],
  [6, 7],
  [7, 4],
  [0, 4],
  [1, 5],
  [2, 6],
  [3, 7],
];

/**
 * Thin white wireframe cube on a transparent canvas (sits on a pure-black hero).
 *
 * Spin uses the requested rotation equations as the core primitive:
 *   x' = x * cos(alpha) - y * sin(alpha)
 *   y' = x * sin(alpha) + y * cos(alpha)
 *   z' = z
 * That rotation (the x-y plane) drives the primary spin; the same formula is
 * applied to the x-z plane with a slower angle so the wireframe reads as 3D.
 */
export function CubeWireframe({ className, speed = 0.7 }: CubeWireframeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduceMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;

    let width = 0;
    let height = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = (alpha: number) => {
      if (!width || !height) return;

      ctx.clearRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;
      const scale = Math.min(width, height) * 0.26;

      const a = alpha; // primary rotation (provided equations, x-y plane)
      const b = alpha * 0.55; // secondary rotation (x-z plane) for 3D depth

      const points = VERTICES.map(([x, y, z]) => {
        // --- provided rotation equations: rotate in the x-y plane ---
        const x1 = x * Math.cos(a) - y * Math.sin(a);
        const y1 = x * Math.sin(a) + y * Math.cos(a);
        const z1 = z;
        // --- same rotation form in the x-z plane to tumble the cube ---
        const x2 = x1 * Math.cos(b) - z1 * Math.sin(b);
        const z2 = x1 * Math.sin(b) + z1 * Math.cos(b);
        const y2 = y1;
        // lightweight perspective projection
        const depth = 4;
        const p = depth / (depth + z2);
        return { x: cx + x2 * scale * p, y: cy + y2 * scale * p };
      });

      ctx.lineWidth = 1.25;
      ctx.lineCap = 'round';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.shadowColor = 'rgba(255, 255, 255, 0.55)';
      ctx.shadowBlur = 10;

      ctx.beginPath();
      for (const [i, j] of EDGES) {
        ctx.moveTo(points[i].x, points[i].y);
        ctx.lineTo(points[j].x, points[j].y);
      }
      ctx.stroke();

      // subtle vertex nodes
      ctx.shadowBlur = 6;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      for (const point of points) {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const observer = new ResizeObserver(() => {
      resize();
      if (reduceMotion) draw(0.6);
    });
    observer.observe(canvas);
    resize();

    if (reduceMotion) {
      draw(0.6);
      return () => observer.disconnect();
    }

    let raf = 0;
    let alpha = 0;
    let last = performance.now();

    const loop = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      alpha += dt * speed;
      draw(alpha);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, [speed]);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
}
