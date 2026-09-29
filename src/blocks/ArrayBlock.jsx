import { useState, useEffect } from 'react';
import { T, COLORS, COLOR_KEYS, inputReset, cellStyle, uid } from '../theme.js';
import { AutoInput, Btn, Controls, AddN, Label, headStyle } from '../controls.jsx';

const MARKER_NAMES = ['i', 'j', 'k', 'min', 'max', 'lo', 'hi', 'mid'];

// Colored index marker (i, j, lo, hi…) sitting under a cell. Drag to another cell,
// drag off the array to remove, double-click to rename.
function IndexMarker({ m, changed, fading, editing, onDown, onEditStart, onRename, onEditEnd }) {
  const c = COLORS[m.color] || COLORS.blue;
  return (
    <div data-nodrag onPointerDown={onDown} onDoubleClick={onEditStart}
      title="Drag to another cell · drag off the array to remove · double-click to rename"
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 3, cursor: 'grab', userSelect: 'none', opacity: fading ? 0.35 : 1 }}>
      <div style={{ width: 0, height: 0, borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderBottom: `6px solid ${c.dot}` }} />
      {editing ? (
        <input autoFocus value={m.name} spellCheck={false}
          onChange={(e) => onRename(e.target.value)}
          onBlur={onEditEnd}
          onKeyDown={(e) => { if (e.key === 'Enter') onEditEnd(); }}
          style={{ ...inputReset, width: `${Math.max(2, m.name.length + 1)}ch`, font: `600 11px ${T.mono}`, color: c.dot, background: '#fff', border: `1px solid ${c.dot}`, borderRadius: 4, padding: '0 4px', lineHeight: '16px', textAlign: 'center' }} />
      ) : (
        <span style={{ font: `600 11px ${T.mono}`, color: c.dot, background: changed ? T.changed : '#fff', border: `1px solid ${c.dot}`, borderRadius: 4, padding: '0 5px', lineHeight: '16px', whiteSpace: 'nowrap' }}>
          {m.name || '?'}
        </span>
      )}
    </div>
  );
}

export default function ArrayBody({ block, patch, active, prev }) {
  const cells = block.cells;
  const markers = block.markers || [];
  const [drag, setDrag] = useState(null);
  const [editing, setEditing] = useState(null);
  const setCell = (i, v) => patch({ cells: cells.map((c, j) => (j === i ? v : c)) });
  const setMarker = (id, p) => patch({ markers: markers.map((m) => (m.id === id ? { ...m, ...p } : m)) });
  const clampIdx = (i) => Math.max(0, Math.min(cells.length - 1, i));

  const addMarker = () => {
    const used = new Set(markers.map((m) => m.name));
    const name = MARKER_NAMES.find((n) => !used.has(n)) || `m${markers.length}`;
    patch({ markers: [...markers, { id: uid(), name, index: 0, color: COLOR_KEYS[markers.length % COLOR_KEYS.length] }] });
  };

  useEffect(() => {
    if (!drag) return;
    const move = (e) => {
      const el = document.elementFromPoint(e.clientX, e.clientY);
      const cell = el?.closest('[data-arr-cell]');
      const inThis = cell && cell.closest('[data-block-id]')?.getAttribute('data-block-id') === block.id;
      if (inThis) {
        const idx = parseInt(cell.getAttribute('data-arr-cell'), 10);
        setDrag((d) => (d && (d.outside || d.index !== idx) ? { ...d, outside: false, index: idx } : d));
        patch({ markers: (block.markers || []).map((m) => (m.id === drag.id && m.index !== idx ? { ...m, index: idx } : m)) });
      } else {
        setDrag((d) => (d && !d.outside ? { ...d, outside: true } : d));
      }
    };
    const up = () => {
      setDrag((d) => {
        if (d?.outside) patch({ markers: (block.markers || []).filter((m) => m.id !== d.id) });
        return null;
      });
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    return () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
  }, [drag?.id, block.markers, block.id]);

  return (
    <div style={{ fontFamily: T.mono, color: T.ink }}>
      <div style={headStyle}>
        <AutoInput value={block.elemType} onChange={(v) => patch({ elemType: v })} style={{ color: T.type }} />
        <span>&nbsp;</span>
        <AutoInput value={block.name} onChange={(v) => patch({ name: v })} style={{ fontWeight: 600 }} />
        <span style={{ color: T.muted }}>[{cells.length}]</span>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', rowGap: 10 }}>
        {cells.map((c, i) => (
          <div key={i} data-arr-cell={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginLeft: i === 0 ? 0 : -1.5 }}>
            <input data-cell value={c} onChange={(e) => setCell(i, e.target.value)} spellCheck={false}
              style={prev && (prev.cells?.[i] ?? '') !== c ? { ...cellStyle, background: T.changed } : cellStyle} />
            <Label style={{ marginTop: 4 }}>{i}</Label>
            {markers.filter((m) => clampIdx(m.index) === i).map((m) => {
              const pm = prev?.markers?.find((x) => x.id === m.id);
              return (
                <IndexMarker key={m.id} m={m}
                  changed={!!prev && (!pm || pm.index !== m.index)}
                  fading={drag?.id === m.id && drag.outside}
                  editing={editing === m.id}
                  onDown={(e) => { if (e.button !== 0 || editing === m.id) return; e.preventDefault(); setDrag({ id: m.id, index: m.index, outside: false }); }}
                  onEditStart={() => setEditing(m.id)}
                  onRename={(name) => setMarker(m.id, { name })}
                  onEditEnd={() => setEditing(null)} />
              );
            })}
          </div>
        ))}
        {cells.length === 0 && <Label style={{ lineHeight: '38px' }}>(empty)</Label>}
      </div>
      <Controls active={active}>
        <AddN label="add" onAdd={(n) => patch({ cells: [...cells, ...Array(n).fill('')] })} />
        <Btn onClick={() => patch({ cells: cells.slice(0, -1) })} disabled={!cells.length}>−</Btn>
        <Btn onClick={addMarker} disabled={!cells.length}>+ index marker</Btn>
      </Controls>
    </div>
  );
}
