import { T, cellStyle } from '../theme.js';
import { AutoInput, Btn, Controls, Label, headStyle } from '../controls.jsx';

// 2D array: `int m[3][4]`. Row indices on the left, column indices on top.
export default function MatrixBody({ block, patch, active, prev }) {
  const rows = block.rows;
  const nCols = rows[0]?.length || 0;
  const setCell = (r, c, v) => patch({ rows: rows.map((row, i) => (i === r ? row.map((x, j) => (j === c ? v : x)) : row)) });
  const idx = { width: 22, textAlign: 'right', paddingRight: 8, boxSizing: 'border-box', flex: 'none' };
  return (
    <div style={{ fontFamily: T.mono, color: T.ink }}>
      <div style={headStyle}>
        <AutoInput value={block.elemType} onChange={(v) => patch({ elemType: v })} style={{ color: T.type }} />
        <span>&nbsp;</span>
        <AutoInput value={block.name} onChange={(v) => patch({ name: v })} style={{ fontWeight: 600 }} />
        <span style={{ color: T.muted }}>[{rows.length}][{nCols}]</span>
      </div>
      <div style={{ display: 'flex', marginBottom: 3 }}>
        <span style={idx} />
        {Array.from({ length: nCols }, (_, j) => (
          <Label key={j} style={{ width: cellStyle.width, textAlign: 'center', marginLeft: j ? -1.5 : 0 }}>{j}</Label>
        ))}
      </div>
      {rows.map((row, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', marginTop: i ? -1.5 : 0 }}>
          <Label style={idx}>{i}</Label>
          {row.map((c, j) => (
            <input key={j} data-cell value={c} spellCheck={false} onChange={(e) => setCell(i, j, e.target.value)}
              style={{ ...cellStyle, marginLeft: j ? -1.5 : 0, ...(prev && (prev.rows?.[i]?.[j] ?? '') !== c ? { background: T.changed } : null) }} />
          ))}
        </div>
      ))}
      <Controls active={active}>
        <Btn onClick={() => patch({ rows: [...rows, Array(Math.max(1, nCols)).fill('')] })}>+ row</Btn>
        <Btn onClick={() => patch({ rows: rows.slice(0, -1) })} disabled={rows.length <= 1}>− row</Btn>
        <Btn onClick={() => patch({ rows: rows.map((r) => [...r, '']) })}>+ column</Btn>
        <Btn onClick={() => patch({ rows: rows.map((r) => r.slice(0, -1)) })} disabled={nCols <= 1}>− column</Btn>
      </Controls>
    </div>
  );
}
