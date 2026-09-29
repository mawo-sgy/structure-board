import { useRef } from 'react';
import { T, COLORS, inputReset } from '../theme.js';
import { useAutoHeight } from '../useAutoIndent.js';

export default function PostItBody({ block, patch }) {
  const ref = useRef(null);
  useAutoHeight(ref, block.text, block.w);
  const paper = COLORS[block.color || 'yellow'].paper;
  return (
    <div style={{
      background: paper, borderRadius: 4, padding: 14, minHeight: 150, boxSizing: 'border-box',
      boxShadow: '0 1px 2px rgba(40,30,10,0.10), 0 8px 18px rgba(40,30,10,0.12)',
    }}>
      <textarea
        ref={ref}
        value={block.text}
        placeholder="Sticky note"
        spellCheck={false}
        onChange={(e) => patch({ text: e.target.value })}
        style={{ ...inputReset, display: 'block', width: '100%', resize: 'none', overflow: 'hidden', font: `14px/1.5 ${T.sans}`, color: T.ink }}
      />
    </div>
  );
}
