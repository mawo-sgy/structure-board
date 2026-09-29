import { describe, it, expect } from 'vitest';
import { createHistory, commit, travel, canUndo, canRedo } from './history.js';

// States are compared by reference, like React state.
const state = (tag) => ({ blocks: [tag], links: [] });

describe('history', () => {
  it('records a state only when it changed', () => {
    const s0 = state('a');
    const h = createHistory(s0);
    expect(commit(h, s0)).toBe(false);
    expect(commit(h, { blocks: s0.blocks, links: s0.links })).toBe(false);
    expect(commit(h, state('b'))).toBe(true);
    expect(h.past).toEqual([s0]);
  });

  it('undoes and redoes in order', () => {
    const [a, b, c] = [state('a'), state('b'), state('c')];
    const h = createHistory(a);
    commit(h, b);
    commit(h, c);
    expect(travel(h, c, -1)).toBe(b);
    expect(travel(h, b, -1)).toBe(a);
    expect(travel(h, a, -1)).toBe(null);
    expect(travel(h, a, 1)).toBe(b);
    expect(travel(h, b, 1)).toBe(c);
    expect(travel(h, c, 1)).toBe(null);
  });

  it('commits pending changes before undoing, so they are what gets undone', () => {
    const [a, b] = [state('a'), state('b')];
    const h = createHistory(a);
    expect(canUndo(h, b)).toBe(true); // uncommitted change counts
    expect(travel(h, b, -1)).toBe(a);
    expect(travel(h, a, 1)).toBe(b);
  });

  it('a new edit clears the redo stack', () => {
    const [a, b, c] = [state('a'), state('b'), state('c')];
    const h = createHistory(a);
    commit(h, b);
    travel(h, b, -1);
    expect(canRedo(h, a)).toBe(true);
    commit(h, c);
    expect(canRedo(h, c)).toBe(false);
  });

  it('redo is unavailable while there are uncommitted edits', () => {
    const [a, b] = [state('a'), state('b')];
    const h = createHistory(a);
    commit(h, b);
    travel(h, b, -1);
    expect(canRedo(h, state('edited'))).toBe(false);
  });

  it('keeps at most `limit` entries', () => {
    const h = createHistory(state(0), 3);
    for (let i = 1; i <= 10; i++) commit(h, state(i));
    expect(h.past.map((s) => s.blocks[0])).toEqual([7, 8, 9]);
  });
});
