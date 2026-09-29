import { useState } from 'react';
import { T, cellStyle } from '../theme.js';
import { AutoInput, Btn, Controls, Label, EmptyBox, headStyle, fieldStyle } from '../controls.jsx';

export default function StackBody({ block, patch, active, prev }) {
  const [val, setVal] = useState('');
  const items = block.items;
  const push = () => { patch({ items: [...items, val] }); setVal(''); };
  const pop = () => patch({ items: items.slice(0, -1) });
  const setItem = (i, v) => patch({ items: items.map((x, j) => (j === i ? v : x)) });
  return (
    <div style={{ fontFamily: T.mono, color: T.ink }}>
      <div style={headStyle}>
        <span style={{ color: T.type }}>stack&nbsp;</span>
        <AutoInput value={block.name} onChange={(v) => patch({ name: v })} style={{ fontWeight: 600 }} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column-reverse', alignItems: 'flex-start' }}>
        {items.length === 0 && <EmptyBox width={84} />}
        {items.map((it, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: i === 0 ? 0 : -1.5 }}>
            <input data-cell value={it} onChange={(e) => setItem(i, e.target.value)} spellCheck={false} style={{ ...cellStyle, width: 84, ...(prev && (prev.items?.[i] ?? null) !== it ? { background: T.changed } : null) }} />
            {i === items.length - 1 && <Label>← top</Label>}
          </div>
        ))}
      </div>
      <Controls active={active}>
        <input value={val} placeholder="value" onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); push(); } }} style={fieldStyle} />
        <Btn onClick={push}>push</Btn>
        <Btn onClick={pop} disabled={!items.length}>pop</Btn>
      </Controls>
    </div>
  );
}
