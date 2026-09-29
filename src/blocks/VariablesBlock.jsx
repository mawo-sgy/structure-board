import { T, cellStyle } from '../theme.js';
import { AutoInput, PointerCell } from '../controls.jsx';

// A single variable: type above, value in one cell, name underneath.
// If the type ends in '*' the cell becomes a pointer: drag from it onto a block.
export default function VariablesBody({ block, patch, prev, pointer }) {
  const legacy = block.vars?.[0] || {};
  const type = block.varType ?? legacy.type ?? 'int';
  const name = block.name ?? legacy.name ?? '';
  const value = block.value ?? legacy.value ?? '';
  const isPtr = type.trim().endsWith('*');
  const minW = Math.max(56, (value.length + 2) * 8.5);
  const changed = prev && (prev.value ?? prev.vars?.[0]?.value ?? '') !== value;
  return (
    <div style={{ fontFamily: T.mono, color: T.ink, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <AutoInput value={type} min={3} onChange={(v) => patch({ varType: v })}
        style={{ color: T.type, fontSize: 11, textAlign: 'center', marginBottom: 4 }} />
      {isPtr ? (
        <PointerCell pointer={pointer} slot="ptr" width={56} height={42} style={{ border: `1.5px solid ${T.line}` }} />
      ) : (
        <input data-cell value={value} placeholder="?" spellCheck={false}
          onChange={(e) => patch({ value: e.target.value })}
          style={{ ...cellStyle, width: minW, height: 42, fontSize: 15, ...(changed ? { background: T.changed } : null) }} />
      )}
      <AutoInput value={name} placeholder="name" min={4} onChange={(v) => patch({ name: v })}
        style={{ fontWeight: 600, fontSize: 13, textAlign: 'center', marginTop: 5 }} />
    </div>
  );
}
