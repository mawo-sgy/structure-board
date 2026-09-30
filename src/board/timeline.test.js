import { describe, it, expect } from 'vitest';
import * as TL from './timeline.js';

const content = (v) => ({ blocks: [{ id: 'a', type: 'list', x: 0, y: 0, value: v }], links: [] });
const valueOf = (c) => c.blocks[0].value;

describe('timeline', () => {
  it('keeps extra fields (a zone carries its own name, position…)', () => {
    const zone = { id: 'z', name: 'Zone 1', x: 5, ...TL.emptyTimeline() };
    const next = TL.saveStep(zone, content('1'));
    expect(next).toMatchObject({ id: 'z', name: 'Zone 1', x: 5 });
    expect(next.steps).toHaveLength(1);
    expect(next.viewing).toBe(next.steps[0].id);
  });

  it('saved steps are copies', () => {
    const c = content('1');
    const tl = TL.saveStep(TL.emptyTimeline(), c);
    c.blocks[0].value = 'changed';
    expect(valueOf(tl.steps[0])).toBe('1');
  });

  it('opening a step keeps the unsaved board as "live", and ← / → walk the steps', () => {
    let tl = TL.emptyTimeline();
    tl = TL.saveStep(tl, content('1'));
    tl = TL.saveStep(tl, content('2'));
    tl = { ...tl, viewing: null }; // back on the live board
    let r = TL.stepBy(tl, -1, content('live'));
    expect(valueOf(r.show)).toBe('2');
    expect(valueOf(r.tl.backup)).toBe('live');
    r = TL.stepBy(r.tl, -1, content('2'));
    expect(valueOf(r.show)).toBe('1');
    expect(valueOf(r.tl.backup)).toBe('live'); // not overwritten by a clean step
    r = TL.stepBy(r.tl, 1, content('1'));
    r = TL.stepBy(r.tl, 1, content('2'));
    expect(valueOf(r.show)).toBe('live');
    expect(r.tl.viewing).toBe(null);
  });

  it('opening another step after editing one keeps the edit as the new "live"', () => {
    let tl = TL.saveStep(TL.saveStep(TL.emptyTimeline(), content('1')), content('2'));
    const r = TL.loadStep(tl, tl.steps[0].id, content('2 edited'));
    expect(valueOf(r.tl.backup)).toBe('2 edited');
  });

  it('update overwrites the viewed step; delete removes it', () => {
    let tl = TL.saveStep(TL.emptyTimeline(), content('1'));
    expect(TL.timelineDirty(tl, content('9'))).toBe(true);
    tl = TL.updateStep(tl, content('9'));
    expect(valueOf(tl.steps[0])).toBe('9');
    expect(TL.timelineDirty(tl, content('9'))).toBe(false);
    tl = TL.deleteViewedStep(tl);
    expect(tl.steps).toEqual([]);
    expect(tl.viewing).toBe(null);
  });

  it('rename and note go through patchStep', () => {
    let tl = TL.saveStep(TL.emptyTimeline(), content('1'));
    tl = TL.patchStep(tl, tl.steps[0].id, { label: 'after swap', note: 'swapped 5 and 2' });
    expect(tl.steps[0]).toMatchObject({ label: 'after swap', note: 'swapped 5 and 2' });
  });
});
