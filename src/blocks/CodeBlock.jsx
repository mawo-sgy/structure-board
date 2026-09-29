import { T, inputReset } from '../theme.js';
import { useAutoIndent, useAutoHeight } from '../useAutoIndent.js';

// VS Code Dark+ palette
const DARK = { bg: '#1e1e1e', header: '#252526', border: '#3c3c3c', text: '#d4d4d4', accent: '#569cd6', gutter: '#858585', title: '#cccccc' };

export default function CodeBody({ block, patch }) {
  const { ref, onKeyDown } = useAutoIndent(block, patch);
  useAutoHeight(ref, block.text, block.w);
  const lines = (block.text || '').split('\n').length;
  return (
    <div style={{
      background: DARK.bg, border: `1px solid ${DARK.border}`, borderRadius: 6, overflow: 'hidden',
      boxShadow: '0 10px 28px rgba(0,0,0,0.18)', fontFamily: T.mono,
    }}>
      <div style={{ background: DARK.header, borderBottom: `1px solid ${DARK.border}`, display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px' }}>
        <span style={{ color: DARK.accent, fontSize: 12, fontWeight: 600 }}>&lt;/&gt;</span>
        <input
          value={block.title}
          spellCheck={false}
          onChange={(e) => patch({ title: e.target.value })}
          style={{ ...inputReset, color: DARK.title, fontSize: 12, flex: 1 }}
        />
      </div>
      <div style={{ display: 'flex' }}>
        <div aria-hidden="true" style={{ padding: '12px 10px 12px 12px', color: DARK.gutter, fontSize: 13, lineHeight: '20px', textAlign: 'right', userSelect: 'none', minWidth: 20 }}>
          {Array.from({ length: lines }, (_, i) => <div key={i}>{i + 1}</div>)}
        </div>
        <textarea
          ref={ref}
          className="sb-code"
          value={block.text}
          wrap="off"
          spellCheck={false}
          placeholder="// write C here"
          onChange={(e) => patch({ text: e.target.value })}
          onKeyDown={onKeyDown}
          style={{
            ...inputReset, flex: 1, display: 'block', resize: 'none', overflowY: 'hidden', overflowX: 'auto',
            padding: '12px 14px 12px 4px', color: DARK.text, fontSize: 13, lineHeight: '20px',
            whiteSpace: 'pre', tabSize: 4, caretColor: '#aeafad',
          }}
        />
      </div>
    </div>
  );
}
