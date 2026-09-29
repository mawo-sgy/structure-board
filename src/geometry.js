// Point where the ray from the center of rect r toward (tx, ty) exits the rect,
// grown by `pad` on every side.
export function edgePoint(r, tx, ty, pad = 0) {
  const cx = r.x + r.w / 2, cy = r.y + r.h / 2;
  const dx = tx - cx, dy = ty - cy;
  if (dx === 0 && dy === 0) return { x: cx, y: cy };
  const hw = r.w / 2 + pad, hh = r.h / 2 + pad;
  const k = Math.min(dx ? hw / Math.abs(dx) : Infinity, dy ? hh / Math.abs(dy) : Infinity);
  return { x: cx + dx * k, y: cy + dy * k };
}
