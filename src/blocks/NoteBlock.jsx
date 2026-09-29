import { T, inputReset } from '../theme.js';
import { useAutoIndent, useAutoHeight } from '../useAutoIndent.js';

export default function NoteBody({ block, patch }) {
  const { ref, onKeyDown } = useAutoIndent(block, patch);
  useAutoHeight(ref, block.text, block.w);
  const rows = Math.max(1, (block.text || '').split('\n').length);
  return (
    <textarea
      ref={ref}
      value={block.text}
      rows={rows}
      placeholder="Write on the board…"
      spellCheck={false}
      onChange={(e) => patch({ text: e.target.value })}
      onKeyDown={onKeyDown}
      style={{
        ...inputReset, display: 'block', width: '100%', resize: 'none', overflow: 'hidden',
        font: `15px/1.55 ${T.sans}`, color: T.ink, whiteSpace: 'pre-wrap', tabSize: 4,
      }}
    />
  );
}
