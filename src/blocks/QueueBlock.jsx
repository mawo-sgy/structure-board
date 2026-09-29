import { useState } from 'react';
import { T, cellStyle } from '../theme.js';
import { AutoInput, Btn, Controls, Label, EmptyBox, headStyle, fieldStyle } from '../controls.jsx';

export default function QueueBody({ block, patch, active, prev }) {
  const [val, setVal] = useState('');
  const items = block.items;
  const enqueue = () => { patch({ items: [...items, val] }); setVal(''); };
  const dequeue = () => patch({ items: items.slice(1) });
  const setItem = (i, v) => patch({ items: items.map((x, j) => (j === i ? v : x)) });
  const tag = (i) => {
    const last = items.length - 1;
    if (i === 0 && last === 0) return 'front·rear';
    if (i === 0) return 'front';
    if (i === last) return 'rear';
    return '\u00a0';
  };
  return (
    <div style={{ fontFamily: T.mono, color: T.ink }}>
      <div style={headStyle}>
        <span style={{ color: T.type }}>queue&nbsp;</span>
        <AutoInput value={block.name} onChange={(v) => patch({ name: v })} style={{ fontWeight: 600 }} />
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', rowGap: 10 }}>
        {items.length === 0 && <EmptyBox width={84} />}
        {items.map((it, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginLeft: i === 0 ? 0 : -1.5 }}>
            <input data-cell value={it} onChange={(e) => setItem(i, e.target.value)} spellCheck={false} style={prev && (prev.items?.[i] ?? null) !== it ? { ...cellStyle, background: T.changed } : cellStyle} />
            <Label style={{ marginTop: 4 }}>{tag(i)}</Label>
          </div>
        ))}
      </div>
      <Controls active={active}>
        <input value={val} placeholder="value" onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); enqueue(); } }} style={fieldStyle} />
        <Btn onClick={enqueue}>enqueue</Btn>
        <Btn onClick={dequeue} disabled={!items.length}>dequeue</Btn>
      </Controls>
    </div>
  );
}
