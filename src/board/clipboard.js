// Clipboard for blocks. localStorage makes it work across tabs and browser windows;
// the module variable is the fallback when storage is unavailable.
const CLIP_KEY = 'structure-board:clipboard';

let memClip = null;
let pasteCount = 0;

export function readClip() {
  try { const raw = localStorage.getItem(CLIP_KEY); if (raw) return JSON.parse(raw); } catch { /* fall back */ }
  return memClip;
}

export function writeClip(group) {
  memClip = group;
  pasteCount = 0;
  try { localStorage.setItem(CLIP_KEY, JSON.stringify(group)); } catch { /* quota / private mode */ }
}

export const hasClip = () => !!readClip()?.blocks?.length;

// 1 for the first paste after a copy, 2 for the next… (used to offset repeated pastes).
export const nextPasteCount = () => ++pasteCount;
