// Undo/redo over { blocks, links } snapshots. `base` is the last committed state; states are
// compared by reference (React state is immutable, so a new array means a change).
// The history object is mutable and meant to live in a ref.

const same = (a, b) => a.blocks === b.blocks && a.links === b.links;

export function createHistory(initial, limit = 100) {
  return { past: [], future: [], base: initial, limit };
}

// Record `cur` as a new entry if it differs from the last committed state.
// Returns true when something was recorded. A new entry clears the redo stack.
export function commit(h, cur) {
  if (same(cur, h.base)) return false;
  h.past.push(h.base);
  if (h.past.length > h.limit) h.past.shift();
  h.future = [];
  h.base = cur;
  return true;
}

// Move one entry back (dir < 0) or forward (dir > 0). Uncommitted changes in `cur` are
// committed first, so they are what gets undone. Returns the state to show, or null.
export function travel(h, cur, dir) {
  commit(h, cur);
  const from = dir < 0 ? h.past : h.future;
  const to = dir < 0 ? h.future : h.past;
  const s = from.pop();
  if (!s) return null;
  to.push(h.base);
  h.base = s;
  return s;
}

export const canUndo = (h, cur) => h.past.length > 0 || !same(cur, h.base);
export const canRedo = (h, cur) => h.future.length > 0 && same(cur, h.base);
