import { useRef } from 'react';
import { T } from './theme.js';
import { BLOCK_DEFS, MENUS } from './blocks/index.js';

const tbBtn = { font: `500 12px ${T.sans}`, color: T.ink, background: '#fff', border: `1px solid ${T.rule}`, borderRadius: 6, padding: '5px 10px', cursor: 'pointer', lineHeight: '16px', whiteSpace: 'nowrap', flex: 'none' };
const tbSelect = { font: `500 12px ${T.sans}`, color: T.ink, background: '#fff', border: `1px solid ${T.rule}`, borderRadius: 6, padding: '5px 8px', cursor: 'pointer', height: 28, whiteSpace: 'nowrap', flex: 'none' };

export function Toolbar({ onAdd, zoom, onZoomIn, onZoomOut, onReset, onUndo, onRedo, canUndo, canRedo, onExport, onExportImage, onImport }) {
  const fileRef = useRef(null);
  return (
    <header style={{
      height: 48, flex: 'none', display: 'flex', alignItems: 'center', gap: 8, padding: '0 14px',
      background: T.chrome, borderBottom: `1px solid ${T.rule}`, font: `13px ${T.sans}`, color: T.ink, position: 'relative', zIndex: 10,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, fontWeight: 600, marginRight: 12, whiteSpace: 'nowrap' }}>
        <span style={{ display: 'flex' }}>
          {[0, 1, 2].map((i) => (
            <span key={i} style={{ width: 7, height: 12, border: `1.5px solid ${T.ink}`, marginLeft: i ? -1.5 : 0 }} />
          ))}
        </span>
        Structure Board
      </div>

      {MENUS.map((m) => (
        <select key={m.label} value="" onChange={(e) => e.target.value && onAdd(e.target.value)} style={tbSelect}>
          <option value="" disabled>{m.label}</option>
          {m.types.map((t) => <option key={t} value={t}>{BLOCK_DEFS[t].label}</option>)}
        </select>
      ))}

      <button onClick={() => onAdd('code')} style={{ ...tbBtn, background: '#1e1e1e', color: '#d4d4d4', borderColor: '#1e1e1e', display: 'flex', gap: 6, alignItems: 'center' }}>
        <span style={{ color: '#569cd6', fontFamily: T.mono, fontSize: 11, fontWeight: 600 }}>&lt;/&gt;</span>Code
      </button>

      <span style={{ width: 1, height: 20, background: T.rule, margin: '0 4px' }} />

      <button onClick={onUndo} disabled={!canUndo} title="Undo (Ctrl+Z)" style={{ ...tbBtn, opacity: canUndo ? 1 : 0.4, cursor: canUndo ? 'pointer' : 'default' }}>↶ Undo</button>
      <button onClick={onRedo} disabled={!canRedo} title="Redo (Ctrl+Shift+Z / Ctrl+Y)" style={{ ...tbBtn, opacity: canRedo ? 1 : 0.4, cursor: canRedo ? 'pointer' : 'default' }}>↷ Redo</button>

      <div style={{ flex: 1 }} />

      <select value="" style={tbSelect}
        onChange={(e) => { if (e.target.value === 'png') onExportImage(); else if (e.target.value === 'json') onExport(); }}>
        <option value="" disabled>Export</option>
        <option value="png">Image (PNG)</option>
        <option value="json">Board file (JSON)</option>
      </select>
      <button onClick={() => fileRef.current?.click()} style={tbBtn}>Import</button>
      <input ref={fileRef} type="file" accept="application/json,.json" style={{ display: 'none' }}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onImport(f); e.target.value = ''; }} />

      <span style={{ width: 1, height: 20, background: T.rule, margin: '0 4px' }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <button onClick={onZoomOut} style={{ ...tbBtn, width: 28, padding: '5px 0' }} title="Zoom out">−</button>
        <span style={{ width: 46, textAlign: 'center', fontFamily: T.mono, fontSize: 12, color: T.muted }}>{Math.round(zoom * 100)}%</span>
        <button onClick={onZoomIn} style={{ ...tbBtn, width: 28, padding: '5px 0' }} title="Zoom in">+</button>
        <button onClick={onReset} style={{ ...tbBtn, marginLeft: 4 }}>Reset view</button>
      </div>
    </header>
  );
}

export function StatusBar({ blockCount, linkCount, selCount = 0 }) {
  return (
    <footer style={{
      height: 28, flex: 'none', display: 'flex', alignItems: 'center', gap: 16, padding: '0 14px',
      background: T.chrome, borderTop: `1px solid ${T.rule}`, font: `11.5px ${T.sans}`, color: T.muted, whiteSpace: 'nowrap', overflow: 'hidden',
    }}>
      <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>
        Drag empty space to pan · Shift+drag to box-select · Ctrl/⌘ + scroll to zoom · Ctrl+Z undo · Ctrl+C / V copy-paste (works across tabs) · F fit all · S save step · ←/→ browse steps · Drag a pointer cell onto a block to link it
      </span>
      <span style={{ fontFamily: T.mono, flex: 'none' }}>
        {selCount > 1 ? `${selCount} selected · ` : ''}{blockCount} block{blockCount === 1 ? '' : 's'} · {linkCount} arrow{linkCount === 1 ? '' : 's'} · saved automatically
      </span>
    </footer>
  );
}
