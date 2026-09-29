import { T } from '../theme.js';
import { AutoInput, Btn, Controls } from '../controls.jsx';

const tblTd = { border: `1.5px solid ${T.line}`, padding: '0 10px', height: 32, fontSize: 13, textAlign: 'center', minWidth: 36 };

export default function TableBody({ block, patch, active, prev }) {
  const { cols, rows } = block;
  const setCol = (c, v) => patch({ cols: cols.map((x, j) => (j === c ? v : x)) });
  const setCell = (r, c, v) => patch({ rows: rows.map((row, i) => (i === r ? row.map((x, j) => (j === c ? v : x)) : row)) });
  const center = { textAlign: 'center' };
  return (
    <div style={{ fontFamily: T.mono, color: T.ink }}>
      <table style={{ borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {cols.map((c, j) => (
              <th key={j} style={{ ...tblTd, fontWeight: 600, background: 'rgba(75,72,65,0.06)' }}>
                <AutoInput value={c} min={2} onChange={(v) => setCol(j, v)} style={center} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td key={j} style={prev && (prev.rows?.[i]?.[j] ?? '') !== cell ? { ...tblTd, background: T.changed } : tblTd}>
                  <AutoInput value={cell} min={2} onChange={(v) => setCell(i, j, v)} style={center} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <Controls active={active}>
        <Btn onClick={() => patch({ rows: [...rows, cols.map(() => '')] })}>+ row</Btn>
        <Btn onClick={() => patch({ rows: rows.slice(0, -1) })} disabled={!rows.length}>− row</Btn>
        <Btn onClick={() => patch({ cols: [...cols, ''], rows: rows.map((r) => [...r, '']) })}>+ column</Btn>
        <Btn onClick={() => patch({ cols: cols.slice(0, -1), rows: rows.map((r) => r.slice(0, -1)) })} disabled={cols.length <= 1}>− column</Btn>
      </Controls>
    </div>
  );
}
