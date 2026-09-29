import { T } from '../theme.js';
import { AutoInput, Btn, Controls, DelX } from '../controls.jsx';

const memTh = { font: `500 10px ${T.sans}`, letterSpacing: '.06em', textTransform: 'uppercase', color: T.muted, textAlign: 'left', padding: '0 10px 5px', fontWeight: 500 };
const memTd = { border: `1.5px solid ${T.line}`, padding: '0 10px', height: 34, fontSize: 13 };

function nextAddress(rows) {
  const last = rows[rows.length - 1]?.addr;
  const n = parseInt(last, 16);
  return '0x' + (Number.isNaN(n) ? 0x1000 : n + 8).toString(16);
}

export default function MemoryBody({ block, patch, active, prev }) {
  const rows = block.rows;
  const setCell = (i, key, v) => patch({ rows: rows.map((r, j) => (j === i ? { ...r, [key]: v } : r)) });
  return (
    <div style={{ fontFamily: T.mono, color: T.ink }}>
      <table style={{ borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={memTh}>address</th>
            <th style={memTh}>name</th>
            <th style={memTh}>type</th>
            <th style={memTh}>value</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <td style={{ ...memTd, color: T.muted }}><AutoInput value={r.addr} min={6} onChange={(v) => setCell(i, 'addr', v)} /></td>
              <td style={{ ...memTd, fontWeight: 600 }}><AutoInput value={r.name} min={3} onChange={(v) => setCell(i, 'name', v)} /></td>
              <td style={{ ...memTd, color: T.type }}><AutoInput value={r.type} min={3} onChange={(v) => setCell(i, 'type', v)} /></td>
              <td style={prev && (prev.rows?.[i]?.value ?? '') !== r.value ? { ...memTd, background: T.changed } : memTd}><AutoInput value={r.value} min={4} onChange={(v) => setCell(i, 'value', v)} /></td>
              <td style={{ paddingLeft: 2 }}><DelX visible={active} onClick={() => patch({ rows: rows.filter((_, j) => j !== i) })} /></td>
            </tr>
          ))}
        </tbody>
      </table>
      <Controls active={active}>
        <Btn onClick={() => patch({ rows: [...rows, { addr: nextAddress(rows), name: '', type: 'int', value: '' }] })}>add address</Btn>
      </Controls>
    </div>
  );
}
