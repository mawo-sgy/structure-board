import { useRef, useLayoutEffect } from 'react';

const INDENT = '    ';

// Tab / Shift+Tab / Enter auto-indent for a textarea bound to block.text.
// Selection is restored after React re-renders via a pending-selection ref.
export function useAutoIndent(block, patch) {
  const ref = useRef(null);
  const pending = useRef(null);
  const value = block.text ?? '';

  useLayoutEffect(() => {
    const el = ref.current, sel = pending.current;
    if (el && sel) { el.setSelectionRange(sel[0], sel[1]); pending.current = null; }
  }, [value]);

  const commit = (next, s, e) => {
    if (next === value) { ref.current?.setSelectionRange(s, e); return; }
    pending.current = [s, e];
    patch({ text: next });
  };

  const onKeyDown = (ev) => {
    if (ev.nativeEvent.isComposing) return;
    const el = ev.currentTarget;
    const v = el.value, s = el.selectionStart, e = el.selectionEnd;
    const lineStart = v.lastIndexOf('\n', s - 1) + 1;

    if (ev.key === 'Tab') {
      ev.preventDefault();
      if (!ev.shiftKey && s === e) return commit(v.slice(0, s) + INDENT + v.slice(e), s + 4, s + 4);

      const lastPos = e > s && v[e - 1] === '\n' ? e - 1 : e;
      let end = v.indexOf('\n', lastPos);
      if (end === -1) end = v.length;
      const lines = v.slice(lineStart, end).split('\n');

      if (!ev.shiftKey) {
        const out = lines.map((l) => INDENT + l).join('\n');
        const ns = s === lineStart ? s : s + 4;
        return commit(v.slice(0, lineStart) + out + v.slice(end), ns, e + 4 * lines.length);
      }
      let first = 0, total = 0;
      const out = lines.map((l, i) => {
        const n = (l.match(/^ {1,4}/) || [''])[0].length;
        if (i === 0) first = n;
        total += n;
        return l.slice(n);
      }).join('\n');
      const ns = Math.max(lineStart, s - first);
      const ne = s === e ? ns : Math.max(ns, e - total);
      return commit(v.slice(0, lineStart) + out + v.slice(end), ns, ne);
    }

    if (ev.key === 'Enter' && !ev.shiftKey && !ev.metaKey && !ev.ctrlKey && !ev.altKey) {
      ev.preventDefault();
      const before = v.slice(lineStart, s);
      let indent = before.match(/^[ \t]*/)[0];
      if (/[{(\[:]\s*$/.test(before)) indent += INDENT;
      const ins = '\n' + indent;
      commit(v.slice(0, s) + ins + v.slice(e), s + ins.length, s + ins.length);
    }
  };

  return { ref, onKeyDown };
}

// Grow a textarea to fit its content (accounts for a horizontal scrollbar).
export function useAutoHeight(ref, ...deps) {
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + (el.offsetHeight - el.clientHeight) + 'px';
  }, deps);
}
