import { useState, useEffect, useRef } from 'react';
import { moveBlocks, blocksInRect, setSlot, addLink } from './model.js';
import { rectFromPoints, MIN_ZONE } from './zones.js';
import { isTyping, blurActive } from './dom.js';

const INTERACTIVE = 'input, textarea, button, select, [data-nodrag]';
// Text cells: a plain click edits them, a Shift+click adds/removes the block from the selection.
export const TEXT_FIELD = 'input, textarea';

// Every pointer gesture on the canvas: pan, move (the whole selection), resize, link/pointer
// drag, Shift+drag box-select, and step zones (draw, move with their blocks, resize). `drag` (a ref owned by Board) holds the gesture in progress,
// so history can skip committing mid-drag. `ctx` is read fresh on every event.
export function useDrag(drag, ctx) {
  const [draft, setDraft] = useState(null); // link being drawn: { from, slot, x, y }
  const [box, setBox] = useState(null);     // box-select / zone-draw rectangle in world coords
  const live = useRef(ctx);
  live.current = ctx;

  useEffect(() => {
    const move = (e) => {
      const d = drag.current;
      if (!d) return;
      const c = live.current;
      const v = c.viewRef.current;
      if (d.kind === 'pan') {
        c.setView((p) => ({ ...p, x: d.vx + e.clientX - d.sx, y: d.vy + e.clientY - d.sy }));
      } else if (d.kind === 'move') {
        if (!d.moved && Math.hypot(e.clientX - d.sx, e.clientY - d.sy) < 3) return;
        d.moved = true;
        c.setBlocks((bs) => moveBlocks(bs, d.starts, (e.clientX - d.sx) / v.s, (e.clientY - d.sy) / v.s));
      } else if (d.kind === 'resize') {
        const w = Math.max(150, Math.round(d.bw + (e.clientX - d.sx) / v.s));
        c.setBlocks((bs) => bs.map((b) => (b.id === d.id ? { ...b, w } : b)));
      } else if (d.kind === 'link') {
        const p = c.toWorld(e.clientX, e.clientY);
        setDraft({ from: d.id, x: p.x, y: p.y, slot: d.slot });
      } else if (d.kind === 'box') {
        const p = c.toWorld(e.clientX, e.clientY);
        const r = { x0: Math.min(d.x, p.x), y0: Math.min(d.y, p.y), x1: Math.max(d.x, p.x), y1: Math.max(d.y, p.y) };
        setBox(r);
        const hits = blocksInRect(c.blocksRef.current, c.sizesRef.current, r);
        c.setSel([...new Set([...d.base, ...hits])]);
      } else if (d.kind === 'zone-draw') {
        const p = c.toWorld(e.clientX, e.clientY);
        setBox({ x0: Math.min(d.x, p.x), y0: Math.min(d.y, p.y), x1: Math.max(d.x, p.x), y1: Math.max(d.y, p.y) });
      } else if (d.kind === 'zone-move') {
        if (!d.moved && Math.hypot(e.clientX - d.sx, e.clientY - d.sy) < 3) return;
        d.moved = true;
        const dx = (e.clientX - d.sx) / v.s, dy = (e.clientY - d.sy) / v.s;
        d.dx = dx; d.dy = dy;
        c.updateZone(d.id, { x: Math.round(d.zx + dx), y: Math.round(d.zy + dy) });
        c.setBlocks((bs) => moveBlocks(bs, d.starts, dx, dy));
      } else if (d.kind === 'zone-resize') {
        c.updateZone(d.id, {
          w: Math.max(MIN_ZONE, Math.round(d.w + (e.clientX - d.sx) / v.s)),
          h: Math.max(MIN_ZONE, Math.round(d.h + (e.clientY - d.sy) / v.s)),
        });
      }
    };

    const up = (e) => {
      const d = drag.current;
      drag.current = null;
      document.body.style.cursor = '';
      if (!d) return;
      const c = live.current;
      if (d.kind === 'move') {
        if (d.moved) setTimeout(() => live.current.commit(), 0);
        else if (d.collapseTo) c.setSel([d.collapseTo]);
      } else if (d.kind === 'resize') {
        setTimeout(() => live.current.commit(), 0);
      } else if (d.kind === 'box') {
        setBox(null);
      } else if (d.kind === 'zone-draw') {
        setBox(null);
        const r = rectFromPoints({ x: d.x, y: d.y }, c.toWorld(e.clientX, e.clientY));
        c.onZoneDrawn(r.w >= MIN_ZONE && r.h >= MIN_ZONE ? r : null);
      } else if (d.kind === 'zone-move') {
        if (d.moved) {
          c.onZoneMoved(d.id, d.dx, d.dy);
          setTimeout(() => live.current.commit(), 0);
        }
      } else if (d.kind === 'link') {
        const to = document.elementFromPoint(e.clientX, e.clientY)?.closest('[data-block-id]')?.getAttribute('data-block-id');
        if (to && to !== d.id) c.setLinks((ls) => (d.slot ? setSlot(ls, d.id, d.slot, to) : addLink(ls, d.id, to)));
        setDraft(null);
      }
    };

    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    return () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
  }, []);

  // Zone-drawing mode: any press on the canvas (even over a block) starts the rectangle.
  const onCanvasDownCapture = (e) => {
    const c = live.current;
    if (!c.zoneMode || e.button !== 0) return;
    e.stopPropagation(); e.preventDefault();
    blurActive();
    const p = c.toWorld(e.clientX, e.clientY);
    drag.current = { kind: 'zone-draw', x: p.x, y: p.y };
    setBox({ x0: p.x, y0: p.y, x1: p.x, y1: p.y });
  };

  // Drag a zone's name: move the zone and the blocks inside it.
  const zoneHeaderDown = (z) => (e) => {
    if (e.button !== 0) return;
    const c = live.current;
    e.stopPropagation(); e.preventDefault();
    blurActive();
    const ids = new Set(c.membersOf(z.id));
    const starts = {};
    for (const b of c.blocksRef.current) if (ids.has(b.id)) starts[b.id] = { x: b.x, y: b.y };
    drag.current = { kind: 'zone-move', id: z.id, zx: z.x, zy: z.y, starts, sx: e.clientX, sy: e.clientY };
    document.body.style.cursor = 'grabbing';
  };

  const zoneResizeDown = (z) => (e) => {
    if (e.button !== 0) return;
    e.stopPropagation(); e.preventDefault();
    drag.current = { kind: 'zone-resize', id: z.id, w: z.w, h: z.h, sx: e.clientX, sy: e.clientY };
    document.body.style.cursor = 'nwse-resize';
  };

  // Empty canvas: pan, or box-select with Shift.
  const onCanvasDown = (e) => {
    const c = live.current;
    if (e.target !== c.canvasRef.current || e.button !== 0) return;
    blurActive();
    if (e.shiftKey) {
      const p = c.toWorld(e.clientX, e.clientY);
      drag.current = { kind: 'box', x: p.x, y: p.y, base: c.selRef.current };
      setBox({ x0: p.x, y0: p.y, x1: p.x, y1: p.y });
      return;
    }
    c.setSel([]);
    const v = c.viewRef.current;
    drag.current = { kind: 'pan', sx: e.clientX, sy: e.clientY, vx: v.x, vy: v.y };
    document.body.style.cursor = 'grabbing';
  };

  // Click selects; Shift+click adds/removes (also on a cell); dragging a selected block moves the
  // whole selection. A plain click on a block of a multi-selection collapses the selection to it
  // on release.
  const frameDown = (b) => (e) => {
    if (e.button !== 0) return;
    const c = live.current;
    const cur = c.selRef.current;
    const onInput = !!e.target.closest(INTERACTIVE);
    const onField = !!e.target.closest(TEXT_FIELD);
    let ids = cur, collapseTo = null;
    if (e.shiftKey && (!onInput || onField)) {
      if (cur.includes(b.id)) { e.preventDefault(); c.setSel(cur.filter((x) => x !== b.id)); return; }
      ids = [...cur, b.id];
      // On a cell: select only (no drag, no editing). BlockFrame stops the cell taking focus.
      if (onField) { e.preventDefault(); blurActive(); c.setSel(ids); return; }
    } else if (onInput || !cur.includes(b.id)) {
      ids = [b.id];
    } else if (cur.length > 1) {
      collapseTo = b.id;
    }
    if (ids !== cur) c.setSel(ids);
    if (onInput) return;
    e.preventDefault();
    blurActive();
    const starts = {};
    for (const x of c.blocksRef.current) if (ids.includes(x.id)) starts[x.id] = { x: x.x, y: x.y };
    drag.current = { kind: 'move', starts, collapseTo, sx: e.clientX, sy: e.clientY };
  };

  const resizeDown = (b) => (e) => {
    const c = live.current;
    e.stopPropagation(); e.preventDefault();
    c.setSel([b.id]);
    drag.current = { kind: 'resize', id: b.id, sx: e.clientX, bw: c.nodes.current[b.id]?.offsetWidth || b.w || 200 };
    document.body.style.cursor = 'ew-resize';
  };

  // Start drawing an arrow: a plain link (slot null) or a pointer from a named slot.
  const connectDown = (b, slot = null) => (e) => {
    if (e.button !== 0) return;
    const c = live.current;
    e.stopPropagation(); e.preventDefault();
    if (isTyping()) blurActive();
    c.setSel([b.id]);
    drag.current = { kind: 'link', id: b.id, slot };
    const p = c.toWorld(e.clientX, e.clientY);
    setDraft({ from: b.id, x: p.x, y: p.y, slot });
    document.body.style.cursor = 'crosshair';
  };

  return { draft, box, onCanvasDown, onCanvasDownCapture, frameDown, resizeDown, connectDown, zoneHeaderDown, zoneResizeDown };
}
