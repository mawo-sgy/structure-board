import { T, uid } from '../theme.js';
import { AutoInput, Btn, Controls, DelX, PointerCell } from '../controls.jsx';

export default function StructBody({ block, patch, active, prev, pointer }) {
  const fields = block.fields;
  const setField = (i, key, v) => patch({ fields: fields.map((f, j) => (j === i ? { ...f, [key]: v } : f)) });
  const row = { display: 'flex', alignItems: 'center', height: 26, whiteSpace: 'nowrap' };
  return (
    <div style={{ fontFamily: T.mono, fontSize: 14, color: T.ink }}>
      <div style={row}>
        <span style={{ color: T.type }}>struct&nbsp;</span>
        <AutoInput value={block.name} onChange={(v) => patch({ name: v })} style={{ fontWeight: 600 }} />
        <span>&nbsp;{'{'}</span>
      </div>
      {fields.map((f, i) => (
        <div key={i} style={{ ...row, paddingLeft: 28 }}>
          <AutoInput value={f.type} onChange={(v) => setField(i, 'type', v)} style={{ color: T.type }} />
          <span>&nbsp;</span>
          <AutoInput value={f.name} placeholder="name" onChange={(v) => setField(i, 'name', v)} />
          <span>;</span>
          <span style={{ color: T.muted }}>&nbsp;&nbsp;=&nbsp;</span>
          {f.type.trim().endsWith('*') ? (
            <PointerCell pointer={pointer} slot={`f:${f.id ?? i}`} width={40} height={22} style={{ border: `1.5px solid ${T.line}` }} />
          ) : (
            <AutoInput value={f.value} placeholder="?" onChange={(v) => setField(i, 'value', v)}
              style={prev && (prev.fields?.[i]?.value ?? '') !== f.value ? { background: T.changed } : undefined} />
          )}
          <DelX visible={active} onClick={() => { pointer?.clear(`f:${f.id ?? i}`); patch({ fields: fields.filter((_, j) => j !== i) }); }} />
        </div>
      ))}
      <div style={row}>
        <span>{'}'}&nbsp;</span>
        <AutoInput value={block.instance} placeholder="instance" onChange={(v) => patch({ instance: v })} />
        <span>;</span>
      </div>
      <Controls active={active}>
        <Btn onClick={() => patch({ fields: [...fields, { id: uid(), type: 'int', name: '', value: '' }] })}>add field</Btn>
      </Controls>
    </div>
  );
}
