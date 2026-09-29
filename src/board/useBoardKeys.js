import { useEffect, useRef } from 'react';
import { isTyping, blurActive } from './dom.js';

// Board keyboard shortcuts. `a` holds the latest actions and is read on every key press:
// { undo, redo, copy, cut, paste, canPaste, duplicate, remove, selectAll, deselect,
//   hasSelection, fitAll, saveStep, stepBy }
export function useBoardKeys(actions) {
  const live = useRef(actions);
  live.current = actions;

  useEffect(() => {
    const onKey = (e) => {
      const a = live.current;
      const mod = (e.ctrlKey || e.metaKey) && !e.altKey;
      const k = e.key.toLowerCase();
      const typing = isTyping();

      // Undo/redo also works while typing inside a block; inputs outside the board
      // (tab names, step notes) keep their native undo.
      if (mod && (k === 'z' || k === 'y')) {
        if (typing && !document.activeElement.closest('[data-block-id]')) return;
        e.preventDefault();
        if (k === 'y' || e.shiftKey) a.redo(); else a.undo();
        return;
      }
      if (e.key === 'Escape') {
        blurActive();
        a.deselect();
        return;
      }
      if (typing) return;
      const sel = a.hasSelection();

      if (mod) {
        if (k === 'c' && sel) { e.preventDefault(); a.copy(); }
        else if (k === 'x' && sel) { e.preventDefault(); a.cut(); }
        else if (k === 'v' && a.canPaste()) { e.preventDefault(); a.paste(); }
        else if (k === 'd' && sel) { e.preventDefault(); a.duplicate(); }
        else if (k === 'a') { e.preventDefault(); a.selectAll(); }
        return;
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && sel) {
        e.preventDefault();
        a.remove();
      } else if (k === 'f' && !e.altKey) {
        a.fitAll();
      } else if (k === 's' && !e.altKey) {
        a.saveStep();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        a.stepBy(e.key === 'ArrowLeft' ? -1 : 1);
      }
    };
    // Inside a block the board's undo owns Ctrl+Z; stop the input's own undo from also running.
    const onBeforeInput = (e) => {
      if ((e.inputType === 'historyUndo' || e.inputType === 'historyRedo') && e.target.closest?.('[data-block-id]')) e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('beforeinput', onBeforeInput, true);
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('beforeinput', onBeforeInput, true); };
  }, []);
}
