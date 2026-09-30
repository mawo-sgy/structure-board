import { describe, it, expect } from 'vitest';
import { fileBase, parseBoardFile, serializeBoard } from './files.js';

describe('fileBase', () => {
  it('turns a tab name into a safe file name', () => {
    expect(fileBase('Bubble sort')).toBe('bubble-sort');
    expect(fileBase('malloc / free walkthrough')).toBe('malloc-free-walkthrough');
    expect(fileBase('  ')).toBe('board');
    expect(fileBase(undefined)).toBe('board');
  });
});

describe('board files', () => {
  it('round-trips blocks, links, view and steps', () => {
    const board = {
      blocks: [{ id: 'a', type: 'list', x: 1, y: 2, value: '5' }],
      links: [{ id: 'l', from: 'a', to: 'a' }],
      view: { x: 3, y: 4, s: 1.5 },
      steps: [{ id: 's', label: 'start', note: 'hi', blocks: [], links: [] }],
      zones: [{ id: 'z', name: 'Zone 1', x: 0, y: 0, w: 100, h: 100, open: false, steps: [], viewing: null, backup: null }],
    };
    expect(parseBoardFile(serializeBoard(board))).toEqual(board);
  });

  it('fills in missing parts of older files', () => {
    const d = parseBoardFile(JSON.stringify({ blocks: [] }));
    expect(d).toEqual({ blocks: [], links: [], steps: [], zones: [], view: null });
  });

  it('drops blocks of unknown types', () => {
    const text = JSON.stringify({ blocks: [{ id: 'a', type: 'list' }, { id: 'b', type: 'hologram' }] });
    expect(parseBoardFile(text, (t) => t === 'list').blocks.map((b) => b.id)).toEqual(['a']);
  });

  it('rejects files that are not boards', () => {
    expect(() => parseBoardFile('{"hello": 1}')).toThrow('missing blocks');
    expect(() => parseBoardFile('not json')).toThrow();
  });
});
