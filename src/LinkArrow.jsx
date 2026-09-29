import { useState } from 'react';
import { T, COLORS } from './theme.js';

export function ArrowDefs() {
  return (
    <defs>
      <marker id="sb-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
        <path d="M0,0 L10,5 L0,10 z" fill={T.line} />
      </marker>
    </defs>
  );
}

// `changed` = the link is new or re-targeted since the reference step (Changes highlight).
export function LinkArrow({ p1, p2, onDelete, draft = false, startDot = false, changed = false }) {
  const [hover, setHover] = useState(false);
  const mx = (p1.x + p2.x) / 2, my = (p1.y + p2.y) / 2;
  const red = COLORS.red.dot;
  return (
    <g>
      {changed && <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke={T.changed} strokeWidth={8} strokeLinecap="round" />}
      <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke={T.line} strokeWidth={1.5}
        strokeDasharray={draft ? '4 4' : undefined} markerEnd="url(#sb-arrow)" />
      {startDot && <circle cx={p1.x} cy={p1.y} r={4} fill={T.line} />}
      {!draft && onDelete && (
        <g data-noexport style={{ pointerEvents: 'all', cursor: 'pointer' }}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={onDelete}
          onPointerEnter={() => setHover(true)}
          onPointerLeave={() => setHover(false)}>
          <circle cx={mx} cy={my} r={8} fill={hover ? '#fff' : T.bg} stroke={hover ? red : T.faint} strokeWidth={1} />
          <text x={mx} y={my} textAnchor="middle" dominantBaseline="central" fontSize={12}
            fill={hover ? red : T.muted} style={{ userSelect: 'none', fontFamily: T.sans }}>×</text>
        </g>
      )}
    </g>
  );
}
