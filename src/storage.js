import { uid } from './theme.js';

export const STORAGE_KEY = 'structure-board:v1';

export function seedBoard() {
  return {
    blocks: [
      { id: 'seed-h', type: 'heading', x: 80, y: 60, color: null, text: 'Find the max of tab' },
      { id: 'seed-a', type: 'array', x: 80, y: 124, color: 'blue', elemType: 'int', name: 'tab', cells: ['5', '2', '9', '1', '', ''] },
      { id: 'seed-v', type: 'variables', x: 480, y: 118, color: null, varType: 'int', name: 'max', value: '5' },
      { id: 'seed-i', type: 'variables', x: 580, y: 118, color: null, varType: 'int', name: 'i', value: '0' },
      { id: 'seed-k', type: 'variables', x: 660, y: 118, color: null, varType: 'int', name: 'n', value: '6' },
      { id: 'seed-n', type: 'note', x: 80, y: 262, w: 360, color: null,
        text: 'Loop invariant:\n    after step i, max holds the largest\n    value in tab[0..i].' },
    ],
    links: [{ id: 'seed-l', from: 'seed-v', to: 'seed-a' }],
    view: { x: 40, y: 20, s: 1 },
  };
}

export function loadBoard() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const d = JSON.parse(raw);
      if (Array.isArray(d.blocks)) {
        return { blocks: d.blocks, links: Array.isArray(d.links) ? d.links : [], view: d.view || { x: 0, y: 0, s: 1 } };
      }
    }
  } catch { /* fall through to seed */ }
  return seedBoard();
}

export function saveBoard(state) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* quota / private mode */ }
}

// ---- workspace (tabs). v2 holds every board; v1 (single board) is migrated into the first tab.
export const WORKSPACE_KEY = 'structure-board:v2';

export function emptyBoard() {
  return { blocks: [], links: [], view: { x: 0, y: 0, s: 1 } };
}

export function loadWorkspace() {
  try {
    const raw = localStorage.getItem(WORKSPACE_KEY);
    if (raw) {
      const w = JSON.parse(raw);
      if (Array.isArray(w.tabs) && w.tabs.length && w.boards) {
        const activeId = w.tabs.some((t) => t.id === w.activeId) ? w.activeId : w.tabs[0].id;
        return { tabs: w.tabs, activeId, boards: w.boards };
      }
    }
  } catch { /* fall through */ }
  const id = uid();
  return { tabs: [{ id, name: 'Board 1' }], activeId: id, boards: { [id]: loadBoard() } };
}

export function saveWorkspace(ws) {
  try { localStorage.setItem(WORKSPACE_KEY, JSON.stringify(ws)); } catch { /* quota / private mode */ }
}
