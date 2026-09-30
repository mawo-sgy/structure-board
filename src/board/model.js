// Pure operations on a board's { blocks, links }. No React, no DOM — every function
// returns new arrays and leaves its inputs untouched.
import { uid } from '../theme.js';

// Pointer links start from a named slot inside a block (list next, pointer variable, struct field).
export const slotOf = (l) => (l.next ? l.slot || 'next' : null);

export const clone = (x) => JSON.parse(JSON.stringify(x));

// Point `slot` of block `from` at `to`, replacing whatever that slot pointed at before.
export function setSlot(links, from, slot, to, id = uid()) {
  return [...clearSlot(links, from, slot), { id, from, to, next: true, slot }];
}

export function clearSlot(links, from, slot) {
  return links.filter((l) => !(l.from === from && slotOf(l) === slot));
}

// Plain block→block arrow. A second arrow between the same two blocks is ignored.
export function addLink(links, from, to, id = uid()) {
  return links.some((l) => l.from === from && l.to === to) ? links : [...links, { id, from, to }];
}

// Remove blocks and every link that touches them.
export function removeBlocks(blocks, links, ids) {
  const set = new Set(ids);
  return {
    blocks: blocks.filter((b) => !set.has(b.id)),
    links: links.filter((l) => !set.has(l.from) && !set.has(l.to)),
  };
}

// Deep copy of some blocks plus the links that stay inside the group.
export function cloneGroup(blocks, links, ids) {
  const set = new Set(ids);
  return clone({
    blocks: blocks.filter((b) => set.has(b.id)),
    links: links.filter((l) => set.has(l.from) && set.has(l.to)),
  });
}

// A copied group with fresh ids, shifted by (dx, dy). Blocks of unknown types are dropped,
// and so are links whose ends were dropped.
export function instantiateGroup(group, dx, dy, isKnownType = () => true, makeId = uid) {
  const ids = {};
  const blocks = group.blocks.filter((b) => isKnownType(b.type)).map((b) => {
    ids[b.id] = makeId();
    return { ...b, id: ids[b.id], x: Math.round(b.x + dx), y: Math.round(b.y + dy) };
  });
  const links = (group.links || [])
    .filter((l) => ids[l.from] && ids[l.to])
    .map((l) => ({ ...l, id: makeId(), from: ids[l.from], to: ids[l.to] }));
  return { blocks, links };
}

// Move the blocks listed in `starts` ({ id: {x, y} }) to their start position + (dx, dy).
export function moveBlocks(blocks, starts, dx, dy) {
  return blocks.map((b) => {
    const s = starts[b.id];
    return s ? { ...b, x: Math.round(s.x + dx), y: Math.round(s.y + dy) } : b;
  });
}

// World-space bounding box of some blocks, using measured sizes (or a guess before first measure).
export function bboxOf(blocks, sizes, fallback = { w: 200, h: 80 }) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const b of blocks) {
    const s = sizes[b.id] || fallback;
    x0 = Math.min(x0, b.x); y0 = Math.min(y0, b.y);
    x1 = Math.max(x1, b.x + s.w); y1 = Math.max(y1, b.y + s.h);
  }
  return { x0, y0, x1, y1 };
}

// Ids of the measured blocks that overlap the rectangle r ({ x0, y0, x1, y1 }).
export function blocksInRect(blocks, sizes, r) {
  return blocks.filter((b) => {
    const s = sizes[b.id];
    return s && b.x < r.x1 && b.x + s.w > r.x0 && b.y < r.y1 && b.y + s.h > r.y0;
  }).map((b) => b.id);
}

// Where to paste a copied group. If the originals are inside the visible area `vis`,
// paste next to them (28px further for each repeated paste); otherwise center it in the view.
export function pasteOffset(blocks, vis, count) {
  const xs = blocks.map((b) => b.x), ys = blocks.map((b) => b.y);
  const gx = (Math.min(...xs) + Math.max(...xs)) / 2, gy = (Math.min(...ys) + Math.max(...ys)) / 2;
  if (gx > vis.x0 && gx < vis.x1 && gy > vis.y0 && gy < vis.y1) return { dx: 28 * count, dy: 28 * count };
  return { dx: (vis.x0 + vis.x1) / 2 - gx - 90, dy: (vis.y0 + vis.y1) / 2 - gy - 40 };
}

// Offset that moves a group so its top-left corner lands on point p (paste at the cursor).
export function offsetTo(blocks, p) {
  return { dx: p.x - Math.min(...blocks.map((b) => b.x)), dy: p.y - Math.min(...blocks.map((b) => b.y)) };
}
