import { useState, useLayoutEffect, useRef, useCallback } from 'react';

// Measures each block's rendered size (height is content-driven) and the center of every
// [data-slot] element inside it, so arrows can attach to edges and pointer slots.
// sizes = { [blockId]: { w, h, anchors?: { [slot]: { x, y } } } }, in unscaled world units.
export function useMeasure(blocks) {
  const [sizes, setSizes] = useState({});
  const [, setTick] = useState(0);
  const nodes = useRef({});
  const sizesRef = useRef(sizes);
  sizesRef.current = sizes;
  const ro = useRef(null);
  if (!ro.current && typeof ResizeObserver !== 'undefined') {
    ro.current = new ResizeObserver(() => setTick((t) => t + 1));
  }

  // Must stay stable (BlockFrame's ref callback depends on it) or the ResizeObserver loops.
  const registerRef = useCallback((id, el) => {
    const prev = nodes.current[id];
    if (prev === el) return;
    if (prev) ro.current?.unobserve(prev);
    if (el) { nodes.current[id] = el; ro.current?.observe(el); }
    else delete nodes.current[id];
  }, []);

  useLayoutEffect(() => {
    const next = {};
    let changed = false;
    for (const b of blocks) {
      const el = nodes.current[b.id];
      if (!el) continue;
      const s = { w: el.offsetWidth, h: el.offsetHeight };
      const slots = el.querySelectorAll('[data-slot]');
      if (slots.length) {
        const br = el.getBoundingClientRect();
        const k = el.offsetWidth / (br.width || 1);
        s.anchors = {};
        slots.forEach((a) => {
          const ar = a.getBoundingClientRect();
          s.anchors[a.getAttribute('data-slot')] = {
            x: Math.round(((ar.left + ar.width / 2) - br.left) * k),
            y: Math.round(((ar.top + ar.height / 2) - br.top) * k),
          };
        });
      }
      next[b.id] = s;
      const p = sizes[b.id];
      if (!p || p.w !== s.w || p.h !== s.h || JSON.stringify(p.anchors) !== JSON.stringify(s.anchors)) changed = true;
    }
    if (Object.keys(next).length !== Object.keys(sizes).length) changed = true;
    if (changed) setSizes(next);
  });

  return { sizes, sizesRef, nodes, registerRef };
}
