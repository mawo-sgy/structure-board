import { useState, useCallback } from 'react';
import { T, COLORS, COLOR_KEYS } from './theme.js';
import { TEXT_FIELD } from './board/useDrag.js';

const frameBarBtn = { font: `500 11px ${T.sans}`, color: T.ink, background: 'transparent', border: 'none', padding: '2px 6px', cursor: 'pointer', borderRadius: 4 };

// Positions a block on the canvas and adds the hover/selection affordances.
// No chrome of its own: the body renders as the bare structure.
// `selected` = part of the selection (dashed outline); `solo` = the only selected block
// (toolbar + link dot). Affordances are data-noexport so image export skips them.
export function BlockFrame({ block, selected, solo = selected, registerRef, onFrameDown, onResizeDown, onConnectDown, onColor, onDuplicate, onDelete, children }) {
  const [hover, setHover] = useState(false);
  const active = hover || selected;
  const id = block.id;
  const refCb = useCallback((el) => registerRef(id, el), [id, registerRef]);
  const wash = block.color && block.type !== 'postit' ? COLORS[block.color] : null;
  const currentColor = block.type === 'postit' ? block.color || 'yellow' : block.color;

  return (
    <div
      ref={refCb}
      data-block-id={id}
      onPointerDown={onFrameDown}
      // Shift+click on a cell selects the block (see useDrag); stop the cell taking focus or
      // starting a text selection. preventDefault on pointerdown alone does not do that.
      onMouseDown={(e) => { if (e.shiftKey && e.target.closest(TEXT_FIELD)) e.preventDefault(); }}
      onPointerEnter={() => setHover(true)}
      onPointerLeave={() => setHover(false)}
      style={{ position: 'absolute', left: block.x, top: block.y, width: block.w ?? 'max-content', zIndex: selected ? 3 : hover ? 2 : 1 }}
    >
      {wash && (
        <div style={{ position: 'absolute', inset: -10, background: wash.wash, border: `1.5px solid ${wash.border}`, borderRadius: 8, zIndex: 0, pointerEvents: 'none' }} />
      )}
      {selected && (
        <div data-noexport style={{ position: 'absolute', inset: -10, border: `1px dashed ${T.select}`, borderRadius: 8, zIndex: 0, pointerEvents: 'none' }} />
      )}

      <div style={{ position: 'relative', zIndex: 1 }}>{children(active)}</div>

      {active && (
        <div data-noexport title="Drag to move" style={{ position: 'absolute', right: '100%', top: -3, paddingRight: 14, color: T.muted, fontSize: 16, lineHeight: 1, cursor: 'grab', userSelect: 'none' }}>⠿</div>
      )}

      {active && (
        <div data-nodrag data-noexport onPointerDown={onResizeDown} title="Resize width"
          style={{ position: 'absolute', top: 0, bottom: 0, right: -16, width: 12, cursor: 'ew-resize', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 4 }}>
          <div style={{ width: 3, height: 22, borderRadius: 2, background: T.faint }} />
        </div>
      )}

      {solo && (
        <div data-nodrag data-noexport onPointerDown={onConnectDown} title="Drag onto another block to link"
          style={{ position: 'absolute', top: -16, right: -16, width: 12, height: 12, borderRadius: '50%', background: '#fff', border: `2px solid ${COLORS.blue.dot}`, cursor: 'crosshair', zIndex: 6, boxSizing: 'border-box' }} />
      )}

      {solo && (
        <div data-nodrag data-noexport style={{ position: 'absolute', bottom: '100%', left: -10, paddingBottom: 16, zIndex: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, background: '#fff', border: `1px solid ${T.rule}`, borderRadius: 8, padding: '4px 6px 4px 8px', boxShadow: '0 2px 8px rgba(30,25,15,0.08)', whiteSpace: 'nowrap' }}>
            {COLOR_KEYS.map((k) => {
              const on = currentColor === k;
              return (
                <button key={k} title={k} onClick={() => onColor(on ? null : k)}
                  style={{ width: 14, height: 14, borderRadius: '50%', background: COLORS[k].dot, border: 'none', padding: 0, cursor: 'pointer', boxShadow: on ? `0 0 0 2px #fff, 0 0 0 3.5px ${COLORS[k].dot}` : 'none' }} />
              );
            })}
            <span style={{ width: 1, height: 14, background: T.rule, margin: '0 1px' }} />
            <button style={frameBarBtn} onClick={onDuplicate}>Duplicate</button>
            <button style={{ ...frameBarBtn, color: COLORS.red.dot }} onClick={onDelete}>Delete</button>
          </div>
        </div>
      )}
    </div>
  );
}
