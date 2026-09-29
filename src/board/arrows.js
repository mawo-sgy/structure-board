// Arrow geometry from blocks, links and measured sizes (see useMeasure).
import { edgePoint } from '../geometry.js';
import { slotOf } from './model.js';

const EDGE_PAD = 10;
const center = (r) => ({ x: r.x + r.w / 2, y: r.y + r.h / 2 });

export function rectOf(blocks, sizes, id) {
  const b = blocks.find((x) => x.id === id);
  const s = sizes[id];
  return b && s ? { x: b.x, y: b.y, w: s.w, h: s.h } : null;
}

// World position of a pointer slot's center inside a block.
export function anchorOf(blocks, sizes, id, slot) {
  const b = blocks.find((x) => x.id === id), a = sizes[id]?.anchors?.[slot];
  return b && a ? { x: b.x + a.x, y: b.y + a.y } : null;
}

// Plain links run edge to edge; slot links start at the slot center (with a dot).
export function buildArrows(blocks, links, sizes, isChanged = () => false) {
  return links.map((l) => {
    const a = rectOf(blocks, sizes, l.from), b = rectOf(blocks, sizes, l.to);
    if (!a || !b) return null;
    const slot = slotOf(l);
    const anc = slot ? anchorOf(blocks, sizes, l.from, slot) : null;
    const ca = anc || center(a), cb = center(b);
    return {
      id: l.id, startDot: !!anc, changed: isChanged(l),
      p1: anc || edgePoint(a, cb.x, cb.y, EDGE_PAD), p2: edgePoint(b, ca.x, ca.y, EDGE_PAD),
    };
  }).filter(Boolean);
}

// The dashed arrow that follows the mouse while linking.
export function buildDraftArrow(blocks, sizes, draft) {
  if (!draft) return null;
  const a = rectOf(blocks, sizes, draft.from);
  if (!a) return null;
  const anc = draft.slot ? anchorOf(blocks, sizes, draft.from, draft.slot) : null;
  return { startDot: !!anc, p1: anc || edgePoint(a, draft.x, draft.y, EDGE_PAD), p2: { x: draft.x, y: draft.y } };
}
