import { useState, useEffect, useRef, useCallback } from 'react';
import { createHistory, commit, travel, canUndo, canRedo } from './history.js';

const HISTORY_LIMIT = 100;
const IDLE_MS = 400;

// Undo/redo for { blocks, links }. Edits are committed after a 400ms pause (so a typing burst
// is one entry). While `isDragging()` is true nothing is committed; the drag code calls
// `commit()` on pointer-up so a whole drag is one entry.
export function useHistory({ blocks, links, setBlocks, setLinks, isDragging, onRestore }) {
  const [, setTick] = useState(0);
  const hist = useRef(null);
  if (!hist.current) hist.current = createHistory({ blocks, links }, HISTORY_LIMIT);
  const cur = useRef(null);
  cur.current = { blocks, links };

  const commitNow = useCallback(() => {
    if (commit(hist.current, cur.current)) setTick((t) => t + 1);
  }, []);

  useEffect(() => {
    if (isDragging()) return;
    const t = setTimeout(commitNow, IDLE_MS);
    return () => clearTimeout(t);
  }, [blocks, links]);

  const restore = (dir) => {
    const s = travel(hist.current, cur.current, dir);
    if (!s) return;
    setBlocks(s.blocks);
    setLinks(s.links);
    onRestore?.();
    setTick((t) => t + 1);
  };

  return {
    commit: commitNow,
    undo: () => restore(-1),
    redo: () => restore(1),
    canUndo: canUndo(hist.current, { blocks, links }),
    canRedo: canRedo(hist.current, { blocks, links }),
  };
}
