import { useState } from 'react';
import { T, COLORS } from './theme.js';

const zoneBtn = { height: 22, padding: '0 8px', borderRadius: 5, border: `1px solid ${T.rule}`, background: '#fff', color: T.ink, font: `500 11px ${T.sans}`, cursor: 'pointer', whiteSpace: 'nowrap' };

// A step zone drawn on the canvas (world coordinates, so it pans and zooms with the blocks).
// The frame lets clicks through to the canvas; only the header and the resize corner are
// interactive. Drag the name to move the zone with its blocks, double-click it to rename.
export function StepZone({ zone, stepCount, onHeaderDown, onResizeDown, onToggle, onRename, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const accent = zone.open ? COLORS.blue.dot : T.faint;

  const commit = () => {
    const name = draft.trim();
    if (name) onRename(name);
    setEditing(false);
  };

  return (
    <div data-zone-id={zone.id} style={{
      position: 'absolute', left: zone.x, top: zone.y, width: zone.w, height: zone.h, boxSizing: 'border-box',
      border: `1.5px dashed ${accent}`, borderRadius: 10, pointerEvents: 'none',
      background: zone.open ? 'rgba(74,127,208,0.035)' : 'transparent',
    }}>
      <div data-nodrag style={{
        position: 'absolute', left: -1, bottom: '100%', marginBottom: 4, zIndex: 4,
        display: 'flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap', pointerEvents: 'auto',
        background: T.bg, borderRadius: 6, padding: '2px 4px 2px 2px',
      }}>
        {editing ? (
          <input autoFocus value={draft} spellCheck={false}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { e.stopPropagation(); setEditing(false); } }}
            style={{ font: `600 12px ${T.sans}`, color: T.ink, width: `${Math.max(6, draft.length + 1)}ch`, border: `1px solid ${COLORS.blue.dot}`, borderRadius: 4, padding: '1px 4px', outline: 'none' }} />
        ) : (
          <span onPointerDown={onHeaderDown} onDoubleClick={() => { setDraft(zone.name); setEditing(true); }}
            title="Drag to move the zone and its blocks · double-click to rename"
            style={{ font: `600 12px ${T.sans}`, color: zone.open ? COLORS.blue.dot : T.muted, cursor: 'grab', userSelect: 'none', padding: '2px 2px' }}>
            {zone.name}
          </span>
        )}
        <button data-noexport onClick={onToggle} title={zone.open ? 'Hide this zone\'s steps' : 'Show this zone\'s steps'}
          style={{ ...zoneBtn, ...(zone.open ? { background: COLORS.blue.dot, borderColor: COLORS.blue.dot, color: '#fff' } : null) }}>
          Steps{stepCount ? ` · ${stepCount}` : ''}
        </button>
        <button data-noexport onClick={onDelete} title="Delete the zone and its steps (the blocks stay)"
          style={{ ...zoneBtn, border: 'none', background: 'transparent', color: T.muted, fontSize: 14, padding: '0 4px' }}>×</button>
      </div>
      <div data-nodrag data-noexport onPointerDown={onResizeDown} title="Resize zone"
        style={{ position: 'absolute', right: -7, bottom: -7, width: 14, height: 14, zIndex: 4, cursor: 'nwse-resize', pointerEvents: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 8, height: 8, borderRight: `2px solid ${accent}`, borderBottom: `2px solid ${accent}` }} />
      </div>
    </div>
  );
}
