import { describe, it, expect } from 'vitest';
import {
  slotOf, setSlot, clearSlot, addLink, removeBlocks, cloneGroup, instantiateGroup,
  moveBlocks, bboxOf, blocksInRect, pasteOffset,
} from './model.js';

const blk = (id, x = 0, y = 0, type = 'list') => ({ id, type, x, y });

describe('links and pointer slots', () => {
  it('slotOf: plain links have no slot; pointer links default to "next"', () => {
    expect(slotOf({ from: 'a', to: 'b' })).toBe(null);
    expect(slotOf({ from: 'a', to: 'b', next: true })).toBe('next');
    expect(slotOf({ from: 'a', to: 'b', next: true, slot: 'left' })).toBe('left');
  });

  it('setSlot re-points a slot instead of adding a second arrow', () => {
    let ls = setSlot([], 'a', 'next', 'b', 'l1');
    ls = setSlot(ls, 'a', 'next', 'c', 'l2');
    expect(ls).toEqual([{ id: 'l2', from: 'a', to: 'c', next: true, slot: 'next' }]);
  });

  it('setSlot leaves other slots of the same block alone', () => {
    let ls = setSlot([], 't', 'left', 'x', 'l1');
    ls = setSlot(ls, 't', 'right', 'y', 'l2');
    expect(ls.map((l) => l.to)).toEqual(['x', 'y']);
    expect(clearSlot(ls, 't', 'left').map((l) => l.to)).toEqual(['y']);
  });

  it('addLink ignores a duplicate plain arrow', () => {
    const ls = addLink([], 'a', 'b', 'l1');
    expect(addLink(ls, 'a', 'b', 'l2')).toBe(ls);
    expect(addLink(ls, 'b', 'a', 'l3')).toHaveLength(2);
  });
});

describe('removeBlocks', () => {
  it('drops the blocks and every link touching them', () => {
    const blocks = [blk('a'), blk('b'), blk('c')];
    const links = [{ id: '1', from: 'a', to: 'b' }, { id: '2', from: 'b', to: 'c' }, { id: '3', from: 'c', to: 'a' }];
    const r = removeBlocks(blocks, links, ['b']);
    expect(r.blocks.map((b) => b.id)).toEqual(['a', 'c']);
    expect(r.links.map((l) => l.id)).toEqual(['3']);
  });
});

describe('copy / paste groups', () => {
  const blocks = [blk('a', 10, 10), blk('b', 50, 10), blk('c', 90, 10)];
  const links = [
    { id: '1', from: 'a', to: 'b', next: true, slot: 'next' },
    { id: '2', from: 'b', to: 'c', next: true, slot: 'next' },
  ];

  it('cloneGroup keeps only links inside the group, as deep copies', () => {
    const g = cloneGroup(blocks, links, ['a', 'b']);
    expect(g.blocks.map((b) => b.id)).toEqual(['a', 'b']);
    expect(g.links.map((l) => l.id)).toEqual(['1']);
    g.blocks[0].x = 999;
    expect(blocks[0].x).toBe(10);
  });

  it('instantiateGroup gives fresh ids, remaps links and shifts positions', () => {
    let n = 0;
    const makeId = () => `new${++n}`;
    const r = instantiateGroup(cloneGroup(blocks, links, ['a', 'b']), 28, 28, () => true, makeId);
    expect(r.blocks.map((b) => [b.id, b.x, b.y])).toEqual([['new1', 38, 38], ['new2', 78, 38]]);
    expect(r.links).toEqual([{ id: 'new3', from: 'new1', to: 'new2', next: true, slot: 'next' }]);
  });

  it('instantiateGroup drops unknown block types and their links', () => {
    const g = { blocks: [blk('a'), blk('z', 0, 0, 'mystery')], links: [{ id: '1', from: 'a', to: 'z' }] };
    const r = instantiateGroup(g, 0, 0, (t) => t !== 'mystery');
    expect(r.blocks).toHaveLength(1);
    expect(r.links).toHaveLength(0);
  });

  it('pasteOffset pastes next to visible originals, stepping 28px per paste', () => {
    const vis = { x0: 0, y0: 0, x1: 500, y1: 500 };
    expect(pasteOffset(blocks, vis, 1)).toEqual({ dx: 28, dy: 28 });
    expect(pasteOffset(blocks, vis, 2)).toEqual({ dx: 56, dy: 56 });
  });

  it('pasteOffset centers the group when the originals are off screen', () => {
    const vis = { x0: 1000, y0: 1000, x1: 1400, y1: 1200 };
    // group center (50, 10) → view center (1200, 1100), minus the (90, 40) nudge
    expect(pasteOffset(blocks, vis, 1)).toEqual({ dx: 1200 - 50 - 90, dy: 1100 - 10 - 40 });
  });
});

describe('geometry helpers', () => {
  it('moveBlocks moves only the blocks with a start position', () => {
    const r = moveBlocks([blk('a', 0, 0), blk('b', 5, 5)], { a: { x: 0, y: 0 } }, 10.4, -3.6);
    expect(r).toEqual([blk('a', 10, -4), blk('b', 5, 5)]);
  });

  it('bboxOf uses measured sizes, or a fallback before measuring', () => {
    const bs = [blk('a', 0, 0), blk('b', 100, 50)];
    expect(bboxOf(bs, { a: { w: 20, h: 10 }, b: { w: 30, h: 40 } })).toEqual({ x0: 0, y0: 0, x1: 130, y1: 90 });
    expect(bboxOf([blk('a', 0, 0)], {})).toEqual({ x0: 0, y0: 0, x1: 200, y1: 80 });
  });

  it('blocksInRect returns measured blocks that overlap the box', () => {
    const bs = [blk('a', 0, 0), blk('b', 100, 100), blk('c', 10, 10)];
    const sizes = { a: { w: 20, h: 20 }, b: { w: 20, h: 20 } }; // c not measured yet
    expect(blocksInRect(bs, sizes, { x0: 15, y0: 15, x1: 50, y1: 50 })).toEqual(['a']);
    expect(blocksInRect(bs, sizes, { x0: 0, y0: 0, x1: 200, y1: 200 })).toEqual(['a', 'b']);
  });
});
