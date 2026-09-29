import { describe, it, expect } from 'vitest';
import { moveTab, nextBoardName, uniqueName } from './tabs.js';

const tabs = ['A', 'B', 'C', 'D'].map((id) => ({ id, name: id }));
const order = (ts) => ts.map((t) => t.id).join('');

describe('moveTab', () => {
  it('drops before or after the target', () => {
    expect(order(moveTab(tabs, 'D', 'A', false))).toBe('DABC');
    expect(order(moveTab(tabs, 'A', 'C', true))).toBe('BCAD');
    expect(order(moveTab(tabs, 'A', 'D', true))).toBe('BCDA');
  });

  it('dropping next to itself changes nothing', () => {
    expect(order(moveTab(tabs, 'B', 'B', false))).toBe('ABCD');
  });

  it('ignores unknown tabs', () => {
    expect(moveTab(tabs, 'Z', 'A', false)).toBe(tabs);
    expect(moveTab(tabs, 'A', 'Z', false)).toBe(tabs);
  });
});

describe('tab names', () => {
  it('nextBoardName skips names already used', () => {
    expect(nextBoardName([{ name: 'Board 1' }])).toBe('Board 2');
    expect(nextBoardName([{ name: 'Board 1' }, { name: 'Board 2' }, { name: 'x' }])).toBe('Board 4');
    expect(nextBoardName([{ name: 'Board 2' }])).toBe('Board 3');
  });

  it('uniqueName numbers duplicates', () => {
    expect(uniqueName([], 'Bubble sort')).toBe('Bubble sort');
    expect(uniqueName([{ name: 'Bubble sort' }], 'Bubble sort')).toBe('Bubble sort 2');
    expect(uniqueName([{ name: 'Bubble sort' }, { name: 'Bubble sort 2' }], 'Bubble sort')).toBe('Bubble sort 3');
  });
});
