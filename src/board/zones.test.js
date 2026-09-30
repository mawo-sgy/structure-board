import { describe, it, expect } from 'vitest';
import { createZone, nextZoneName, rectFromPoints, rectAround, zoneMembers, zoneContent, replaceZoneContent, shiftTimeline } from './zones.js';

const node = (id, x, y, value = '') => ({ id, type: 'list', x, y, value });
const ptr = (id, from, to) => ({ id, from, to, next: true, slot: 'next' });

describe('zone geometry', () => {
  it('rectFromPoints works in any drag direction', () => {
    expect(rectFromPoints({ x: 100, y: 50 }, { x: 20, y: 80 })).toEqual({ x: 20, y: 50, w: 80, h: 30 });
  });

  it('rectAround pads a bounding box', () => {
    expect(rectAround({ x0: 10, y0: 20, x1: 110, y1: 70 }, 30)).toEqual({ x: -20, y: -10, w: 160, h: 110 });
  });

  it('new zones get the next free name and start open with an empty timeline', () => {
    const z = createZone({ x: 0.4, y: 0, w: 100, h: 80 }, [{ name: 'Zone 1' }]);
    expect(z).toMatchObject({ name: 'Zone 2', x: 0, w: 100, open: true, steps: [], viewing: null, backup: null });
    expect(nextZoneName([{ name: 'Zone 2' }])).toBe('Zone 3');
  });
});

describe('shiftTimeline', () => {
  it('moves the blocks in every step and in the live backup, and nothing else', () => {
    const z = {
      id: 'z', x: 0, y: 0,
      steps: [{ id: 's', label: 'a', blocks: [node('a', 10, 20)], links: [ptr('l', 'a', 'a')] }],
      backup: { blocks: [node('a', 1, 2)], links: [] },
      viewing: 's',
    };
    const r = shiftTimeline(z, 100.4, -5);
    expect(r.steps[0].blocks[0]).toMatchObject({ x: 110, y: 15 });
    expect(r.steps[0].links).toEqual(z.steps[0].links);
    expect(r.backup.blocks[0]).toMatchObject({ x: 101, y: -3 });
    expect(r).toMatchObject({ id: 'z', x: 0, viewing: 's' });
    expect(shiftTimeline({ steps: [], backup: null }, 1, 1).backup).toBe(null);
  });
});

describe('zoneMembers', () => {
  const zone = { x: 0, y: 0, w: 200, h: 100 };
  it('uses the block center, so a block half outside can still belong', () => {
    const blocks = [node('in', 10, 10), node('edge', 170, 10), node('out', 190, 10)];
    const sizes = { in: { w: 50, h: 40 }, edge: { w: 50, h: 40 }, out: { w: 50, h: 40 } };
    expect(zoneMembers(blocks, sizes, zone)).toEqual(['in', 'edge']); // edge center x=195, out center x=215
  });

  it('falls back to the top-left corner before a block is measured', () => {
    expect(zoneMembers([node('a', 199, 99), node('b', 201, 0)], {}, zone)).toEqual(['a']);
  });
});

describe('zone content', () => {
  const blocks = [node('a', 0, 0, '1'), node('b', 50, 0, '2'), node('out', 500, 0, '9')];
  const links = [ptr('ab', 'a', 'b'), ptr('bo', 'b', 'out'), ptr('oa', 'out', 'a')];

  it('takes the zone blocks and the links that start from them', () => {
    const c = zoneContent(blocks, links, ['a', 'b']);
    expect(c.blocks.map((b) => b.id)).toEqual(['a', 'b']);
    expect(c.links.map((l) => l.id)).toEqual(['ab', 'bo']);
  });

  it('replacing restores values and pointers inside the zone only', () => {
    const saved = zoneContent(blocks, links, ['a', 'b']);
    // later: a's value changed, a now points to out, b's pointer is gone, out changed too
    const nowBlocks = [node('a', 0, 0, '7'), node('b', 50, 0, '2'), node('out', 500, 0, 'X')];
    const nowLinks = [ptr('a2', 'a', 'out'), ptr('oa', 'out', 'a')];
    const r = replaceZoneContent(nowBlocks, nowLinks, ['a', 'b'], saved);
    expect(r.blocks.map((b) => `${b.id}=${b.value}`)).toEqual(['a=1', 'b=2', 'out=X']);
    expect(r.links.map((l) => l.id).sort()).toEqual(['ab', 'bo', 'oa']);
  });

  it('removes blocks added to the zone since the step, and brings back deleted ones', () => {
    const saved = zoneContent(blocks, links, ['a', 'b']);
    const nowBlocks = [node('a', 0, 0, '1'), node('new', 20, 20), node('out', 500, 0)];
    const nowLinks = [ptr('an', 'a', 'new'), ptr('oa', 'out', 'a')];
    const r = replaceZoneContent(nowBlocks, nowLinks, ['a', 'new'], saved);
    expect(r.blocks.map((b) => b.id)).toEqual(['a', 'out', 'b']);
    expect(r.links.map((l) => l.id).sort()).toEqual(['ab', 'bo', 'oa']);
  });

  it('drops outside links that pointed at a block the step removes', () => {
    const r = replaceZoneContent([node('x', 0, 0), node('out', 500, 0)], [ptr('ox', 'out', 'x')], ['x'], { blocks: [], links: [] });
    expect(r.blocks.map((b) => b.id)).toEqual(['out']);
    expect(r.links).toEqual([]);
  });
});
