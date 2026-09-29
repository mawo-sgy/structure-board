import { useState } from 'react';
import { T, inputReset } from './theme.js';

// A cell that holds a pointer. Drag from it onto a block to point there; double-click for NULL.
// The board draws the arrow from this cell's center (found via data-slot).
export function PointerCell({ pointer, slot, width = 40, height = '100%', style }) {
  const linked = pointer?.isLinked(slot);
  const changed = pointer?.changed?.(slot);
  return (
    <div
      data-nodrag
      data-slot={slot}
      title={linked ? 'Drag to re-point · double-click for NULL' : 'Drag onto a block to point at it'}
      onPointerDown={pointer?.start(slot)}
      onDoubleClick={() => pointer?.clear(slot)}
      style={{
        width, height, boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: T.muted, fontSize: 10, fontFamily: T.mono, cursor: 'crosshair', userSelect: 'none', flex: 'none',
        ...(changed ? { background: T.changed } : null), ...style,
      }}
    >
      {linked ? '' : 'NULL'}
    </div>
  );
}

export const headStyle = { fontSize: 13, marginBottom: 8, display: 'flex', alignItems: 'baseline', whiteSpace: 'nowrap' };

export const fieldStyle = {
  width: 72, font: `12px ${T.mono}`, padding: '3px 6px', border: `1px solid ${T.rule}`,
  borderRadius: 5, background: '#fff', color: T.ink, outline: 'none',
};

export function AutoInput({ value, onChange, placeholder = '', min = 1, style, ...rest }) {
  const len = Math.max(min, (value || placeholder).length);
  return (
    <input
      value={value ?? ''}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      spellCheck={false}
      style={{ ...inputReset, width: `${len + 0.5}ch`, ...style }}
      {...rest}
    />
  );
}

export function Btn({ children, style, disabled, ...rest }) {
  return (
    <button
      disabled={disabled}
      {...rest}
      style={{
        font: `500 11px ${T.sans}`, color: T.ink, background: '#fff', border: `1px solid ${T.rule}`,
        borderRadius: 5, padding: '3px 8px', lineHeight: '16px',
        cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.45 : 1, ...style,
      }}
    >
      {children}
    </button>
  );
}

// Control row that floats under a block and only shows while hovered/selected,
// so it never changes the block's measured size.
export function Controls({ active, children }) {
  return (
    <div
      data-nodrag
      data-noexport
      style={{
        position: 'absolute', top: '100%', left: 0, paddingTop: 12, display: 'flex', gap: 6,
        alignItems: 'center', whiteSpace: 'nowrap', zIndex: 5, fontFamily: T.sans,
        opacity: active ? 1 : 0, pointerEvents: active ? 'auto' : 'none', transition: 'opacity .12s',
      }}
    >
      {children}
    </div>
  );
}

export function AddN({ onAdd, label = 'add' }) {
  const [n, setN] = useState(1);
  const add = () => onAdd(Math.max(1, Math.min(64, parseInt(n, 10) || 1)));
  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
      <input
        type="number" min={1} max={64} value={n}
        onChange={(e) => setN(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') add(); }}
        style={{ ...fieldStyle, width: 38, textAlign: 'center' }}
      />
      <Btn onClick={add}>{label}</Btn>
    </div>
  );
}

export function DelX({ visible = true, onClick, style }) {
  return (
    <button
      title="Remove"
      onClick={onClick}
      style={{
        border: 'none', background: 'transparent', color: T.muted, cursor: 'pointer',
        font: `14px ${T.sans}`, padding: '0 4px', lineHeight: 1,
        visibility: visible ? 'visible' : 'hidden', ...style,
      }}
    >
      ×
    </button>
  );
}

export function Label({ children, style }) {
  return <span style={{ font: `10px ${T.mono}`, color: T.muted, whiteSpace: 'nowrap', ...style }}>{children}</span>;
}

export function EmptyBox({ children = 'empty', width = 72 }) {
  return (
    <div style={{
      height: 38, width, boxSizing: 'border-box', border: `1.5px dashed ${T.faint}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: T.muted,
    }}>
      {children}
    </div>
  );
}
