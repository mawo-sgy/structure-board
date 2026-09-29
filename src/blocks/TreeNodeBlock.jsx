import { T, inputReset } from '../theme.js';
import { Btn, Controls, PointerCell } from '../controls.jsx';

const CHILD_DX = 80;
const CHILD_DY = 100;

// One binary-tree node: [ left | data | right ]. Drag from left/right onto another node to
// point at it; double-click a pointer cell for NULL. "+ left" / "+ right" create a linked child.
export default function TreeNodeBody({ block, patch, active, pointer, prev }) {
  const value = block.value ?? '';
  const changed = prev && (prev.value ?? '') !== value;
  const side = { borderLeft: `1.5px solid ${T.line}` };
  return (
    <div style={{ fontFamily: T.mono, color: T.ink, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ display: 'flex', height: 40, boxSizing: 'border-box', border: `1.5px solid ${T.line}` }}>
        <PointerCell pointer={pointer} slot="left" width={30} />
        <div style={{ ...side, display: 'flex', alignItems: 'center', padding: '0 4px', background: changed ? T.changed : 'transparent', borderRight: side.borderLeft }}>
          <input data-cell value={value} placeholder="val" spellCheck={false}
            onChange={(e) => patch({ value: e.target.value })}
            style={{ ...inputReset, width: Math.max(36, (value.length + 2) * 8.5), textAlign: 'center', fontSize: 14, fontWeight: 600 }} />
        </div>
        <PointerCell pointer={pointer} slot="right" width={30} />
      </div>
      <div style={{ display: 'flex', width: '100%', marginTop: 4, fontSize: 10, color: T.muted }}>
        <span style={{ width: 30, textAlign: 'center' }}>left</span>
        <span style={{ flex: 1, textAlign: 'center' }}>data</span>
        <span style={{ width: 30, textAlign: 'center' }}>right</span>
      </div>
      <Controls active={active}>
        <Btn onClick={() => pointer.spawn('left', -CHILD_DX, CHILD_DY)} disabled={pointer.isLinked('left')}>+ left</Btn>
        <Btn onClick={() => pointer.spawn('right', CHILD_DX, CHILD_DY)} disabled={pointer.isLinked('right')}>+ right</Btn>
      </Controls>
    </div>
  );
}
