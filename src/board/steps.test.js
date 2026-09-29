import { describe, it, expect } from 'vitest';
import { snap, isDirty, referenceStep, changeIndex, slotChanged, linkChanged, stepTarget } from './steps.js';

const node = (id, value) => ({ id, type: 'list', x: 0, y: 0, value });
const ptr = (id, from, to, slot = 'next') => ({ id, from, to, next: true, slot });
const step = (id, blocks, links = []) => ({ id, label: '', note: '', blocks, links });

describe('snapshots', () => {
  it('snap deep-copies, so later edits do not leak into the step', () => {
    const blocks = [node('a', '1')];
    const s = snap(blocks, []);
    blocks[0].value = '2';
    expect(s.blocks[0].value).toBe('1');
  });

  it('isDirty compares content, not identity', () => {
    const s = step('s1', [node('a', '1')]);
    expect(isDirty([node('a', '1')], [], s)).toBe(false);
    expect(isDirty([node('a', '2')], [], s)).toBe(true);
    expect(isDirty([node('a', '2')], [], null)).toBe(false);
  });
});

describe('referenceStep', () => {
  const steps = [step('s1', []), step('s2', []), step('s3', [])];
  it('compares a viewed step with the one before it', () => {
    expect(referenceStep(steps, 1, false).id).toBe('s1');
    expect(referenceStep(steps, 0, false)).toBeUndefined();
  });
  it('compares an edited step with itself', () => {
    expect(referenceStep(steps, 1, true).id).toBe('s2');
  });
  it('on the live board, compares with the last step', () => {
    expect(referenceStep(steps, -1, false).id).toBe('s3');
  });
});

describe('pointer change detection', () => {
  const prev = step('s1', [node('a'), node('b'), node('c')], [ptr('l1', 'a', 'b')]);
  const index = changeIndex(prev);

  it('an unchanged pointer is not highlighted', () => {
    const links = [ptr('l1', 'a', 'b')];
    expect(slotChanged(index, links, 'a', 'next')).toBe(false);
    expect(linkChanged(index, links, links[0])).toBe(false);
  });

  it('a re-pointed slot is highlighted, even with a new link id', () => {
    const links = [ptr('l9', 'a', 'c')];
    expect(slotChanged(index, links, 'a', 'next')).toBe(true);
    expect(linkChanged(index, links, links[0])).toBe(true);
  });

  it('a pointer set back to NULL is highlighted on its cell', () => {
    expect(slotChanged(index, [], 'a', 'next')).toBe(true);
  });

  it('a pointer on a block that is new since the step is not highlighted', () => {
    const links = [ptr('l2', 'new', 'a')];
    expect(slotChanged(index, links, 'new', 'next')).toBe(false);
    expect(linkChanged(index, links, links[0])).toBe(false);
  });

  it('a new plain arrow is highlighted, an old one is not', () => {
    const idx = changeIndex(step('s', [node('a'), node('b')], [{ id: 'p', from: 'a', to: 'b' }]));
    expect(linkChanged(idx, [], { id: 'x', from: 'a', to: 'b' })).toBe(false);
    expect(linkChanged(idx, [], { id: 'y', from: 'b', to: 'a' })).toBe(true);
  });

  it('no reference step means nothing is highlighted', () => {
    expect(changeIndex(undefined)).toBe(null);
    expect(slotChanged(null, [], 'a', 'next')).toBe(false);
  });
});

describe('stepTarget (← / →)', () => {
  const steps = [step('s1', []), step('s2', []), step('s3', [])];
  it('from the live board, ← opens the last step and → does nothing', () => {
    expect(stepTarget(steps, -1, -1, false)).toEqual({ load: 's3' });
    expect(stepTarget(steps, -1, 1, false)).toBe(null);
  });
  it('moves between steps and stops at the first one', () => {
    expect(stepTarget(steps, 1, 1, false)).toEqual({ load: 's3' });
    expect(stepTarget(steps, 1, -1, false)).toEqual({ load: 's1' });
    expect(stepTarget(steps, 0, -1, false)).toBe(null);
  });
  it('→ past the last step returns to the live board only if there is one', () => {
    expect(stepTarget(steps, 2, 1, true)).toEqual({ live: true });
    expect(stepTarget(steps, 2, 1, false)).toBe(null);
  });
  it('does nothing without steps', () => {
    expect(stepTarget([], -1, -1, true)).toBe(null);
  });
});
