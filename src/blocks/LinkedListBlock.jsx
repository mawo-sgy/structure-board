import { T, inputReset } from '../theme.js';
import { Btn, Controls, PointerCell } from '../controls.jsx';

// One linked-list node: [ data | next ]. Drag from the next cell onto another node to
// point at it; double-click the next cell to set it back to NULL. "+ next node" adds a linked node.
export default function ListBody({ block, patch, active, pointer, prev }) {
  const value = block.value ?? block.nodes?.[0] ?? '';
  const changed = prev && (prev.value ?? prev.nodes?.[0] ?? '') !== value;
  return (
    <div style={{ fontFamily: T.mono, color: T.ink, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ display: 'flex', height: 40, boxSizing: 'border-box', border: `1.5px solid ${T.line}` }}>
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '0 4px', background: changed ? T.changed : 'transparent' }}>
          <input data-cell value={value} placeholder="val" spellCheck={false}
            onChange={(e) => patch({ value: e.target.value })}
            style={{ ...inputReset, width: Math.max(40, (value.length + 2) * 8.5), textAlign: 'center', fontSize: 14 }} />
        </div>
        <PointerCell pointer={pointer} slot="next" width={40} style={{ borderLeft: `1.5px solid ${T.line}` }} />
      </div>
      <div style={{ display: 'flex', width: '100%', marginTop: 4, fontSize: 10, color: T.muted }}>
        <span style={{ flex: 1, textAlign: 'center' }}>data</span>
        <span style={{ width: 40, textAlign: 'center' }}>next</span>
      </div>
      <Controls active={active}>
        <Btn onClick={() => pointer.spawn('next', 150, 0)} disabled={pointer.isLinked('next')}>+ next node</Btn>
      </Controls>
    </div>
  );
}
