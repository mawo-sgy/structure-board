// Step zones: rectangles on the canvas with their own step timeline. A zone's content is the
// blocks whose center is inside it (decided when you save or load), plus the links that start
// from those blocks. Pure functions only.
import { uid } from '../theme.js';
import { clone } from './model.js';
import { emptyTimeline } from './timeline.js';

export const MIN_ZONE = 60;

export function createZone(rect, zones) {
  return {
    id: uid(), name: nextZoneName(zones),
    x: Math.round(rect.x), y: Math.round(rect.y), w: Math.round(rect.w), h: Math.round(rect.h),
    open: true, ...emptyTimeline(),
  };
}

export function nextZoneName(zones) {
  let n = zones.length + 1;
  while (zones.some((z) => z.name === `Zone ${n}`)) n++;
  return `Zone ${n}`;
}

// Normalize a dragged rectangle (any direction) to { x, y, w, h }.
export function rectFromPoints(a, b) {
  return { x: Math.min(a.x, b.x), y: Math.min(a.y, b.y), w: Math.abs(a.x - b.x), h: Math.abs(a.y - b.y) };
}

// A zone rectangle around a bounding box ({ x0, y0, x1, y1 }) with some padding.
export function rectAround(bbox, pad = 30) {
  return { x: bbox.x0 - pad, y: bbox.y0 - pad, w: bbox.x1 - bbox.x0 + pad * 2, h: bbox.y1 - bbox.y0 + pad * 2 };
}

// Ids of the blocks whose center lies inside the zone (unmeasured blocks use their top-left).
export function zoneMembers(blocks, sizes, z) {
  return blocks.filter((b) => {
    const s = sizes[b.id];
    const cx = b.x + (s ? s.w / 2 : 0), cy = b.y + (s ? s.h / 2 : 0);
    return cx >= z.x && cx <= z.x + z.w && cy >= z.y && cy <= z.y + z.h;
  }).map((b) => b.id);
}

// Deep copy of the zone's blocks and of the links that start from them.
export function zoneContent(blocks, links, ids) {
  const set = new Set(ids);
  return clone({ blocks: blocks.filter((b) => set.has(b.id)), links: links.filter((l) => set.has(l.from)) });
}

// Shift every block a zone's timeline remembers (steps and live backup) by (dx, dy), so the
// steps follow the zone when you drag it with its blocks.
export function shiftTimeline(z, dx, dy) {
  const shift = (c) => c && { ...c, blocks: c.blocks.map((b) => ({ ...b, x: Math.round(b.x + dx), y: Math.round(b.y + dy) })) };
  return { ...z, steps: z.steps.map(shift), backup: shift(z.backup) };
}

// Put `content` into the zone. Blocks now in the zone (`currentIds`) that are not in `content`
// are removed; blocks in `content` replace their current version (keeping stacking order) or are
// added. Links from zone blocks are replaced by the content's links; other links are kept as long
// as both ends still exist.
export function replaceZoneContent(blocks, links, currentIds, content) {
  const incoming = new Map(content.blocks.map((b) => [b.id, b]));
  const drop = new Set(currentIds);
  const out = [];
  for (const b of blocks) {
    if (incoming.has(b.id)) { out.push(incoming.get(b.id)); incoming.delete(b.id); }
    else if (!drop.has(b.id)) out.push(b);
  }
  out.push(...incoming.values());
  const present = new Set(out.map((b) => b.id));
  const owned = new Set([...currentIds, ...content.blocks.map((b) => b.id)]);
  return {
    blocks: out,
    links: [
      ...links.filter((l) => !owned.has(l.from) && present.has(l.from) && present.has(l.to)),
      ...content.links.filter((l) => present.has(l.from) && present.has(l.to)),
    ],
  };
}
