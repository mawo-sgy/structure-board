import { useState, useEffect, useRef } from 'react';

const MIN_ZOOM = 0.2;
const MAX_ZOOM = 3;

// Pan/zoom state { x, y, s } for the canvas: world point p appears at screen p * s + (x, y).
// Ctrl/Cmd+wheel zooms at the cursor, plain wheel pans.
export function useViewport(initial, canvasRef) {
  const [view, setView] = useState(initial || { x: 0, y: 0, s: 1 });
  const viewRef = useRef(view);
  viewRef.current = view;

  const toWorld = (cx, cy) => {
    const r = canvasRef.current.getBoundingClientRect();
    const v = viewRef.current;
    return { x: (cx - r.left - v.x) / v.s, y: (cy - r.top - v.y) / v.s };
  };

  // The part of the world currently on screen.
  const visibleRect = () => {
    const r = canvasRef.current.getBoundingClientRect();
    const v = viewRef.current;
    return { x0: -v.x / v.s, y0: -v.y / v.s, x1: (r.width - v.x) / v.s, y1: (r.height - v.y) / v.s };
  };

  const zoomAt = (sx, sy, f) => setView((v) => {
    const s = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, v.s * f));
    const k = s / v.s;
    return { s, x: sx - (sx - v.x) * k, y: sy - (sy - v.y) * k };
  });

  const zoomCenter = (f) => {
    const r = canvasRef.current.getBoundingClientRect();
    zoomAt(r.width / 2, r.height / 2, f);
  };

  // Frame a world-space box with some padding (zoom capped at 150%).
  const fitTo = ({ x0, y0, x1, y1 }) => {
    if (!canvasRef.current) return;
    const r = canvasRef.current.getBoundingClientRect();
    const pad = 80;
    const s = Math.min(1.5, Math.max(MIN_ZOOM, Math.min(r.width / (x1 - x0 + pad * 2), r.height / (y1 - y0 + pad * 2))));
    setView({ s, x: r.width / 2 - ((x0 + x1) / 2) * s, y: r.height / 2 - ((y0 + y1) / 2) * s });
  };

  useEffect(() => {
    const el = canvasRef.current;
    const onWheel = (e) => {
      e.preventDefault();
      const r = el.getBoundingClientRect();
      if (e.ctrlKey || e.metaKey) zoomAt(e.clientX - r.left, e.clientY - r.top, Math.exp(-e.deltaY * 0.0015));
      else setView((v) => ({ ...v, x: v.x - e.deltaX, y: v.y - e.deltaY }));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  return { view, setView, viewRef, toWorld, visibleRect, zoomCenter, fitTo };
}
