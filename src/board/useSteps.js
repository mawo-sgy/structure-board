import { useState, useMemo } from 'react';
import { changeIndex, referenceStep, slotChanged, linkChanged } from './steps.js';
import * as TL from './timeline.js';
import { createZone, zoneMembers, zoneContent, replaceZoneContent, shiftTimeline } from './zones.js';

// Step timelines: one for the whole board, plus one per step zone. Every action takes a scope:
// null = the whole board, or a zone id. `onLoad` runs whenever board content is replaced.
export function useSteps({ initial, blocks, links, sizes, setBlocks, setLinks, onLoad }) {
  const [board, setBoard] = useState({ steps: initial.steps || [], viewing: initial.viewing || null, backup: initial.backup || null });
  const [zones, setZones] = useState(initial.zones || []);
  const [showChanges, setShowChanges] = useState(initial.showChanges ?? true);

  // ---- per-scope helpers
  const tlOf = (zid) => (zid ? zones.find((z) => z.id === zid) : board);
  const membersOf = (zid) => zoneMembers(blocks, sizes, tlOf(zid));
  const contentOf = (zid) => (zid ? zoneContent(blocks, links, membersOf(zid)) : { blocks, links });
  const setTl = (zid, tl) => {
    const t = { steps: tl.steps, viewing: tl.viewing, backup: tl.backup };
    if (zid) setZones((zs) => zs.map((z) => (z.id === zid ? { ...z, ...t } : z)));
    else setBoard(t);
  };
  const show = (zid, content) => {
    if (zid) {
      const r = replaceZoneContent(blocks, links, membersOf(zid), content);
      setBlocks(r.blocks); setLinks(r.links);
    } else {
      setBlocks(content.blocks); setLinks(content.links);
    }
    onLoad?.();
  };
  // Run a timeline op that may also replace content: fn(tl, content) → { tl, show }.
  const run = (zid, fn) => {
    const tl = tlOf(zid);
    if (!tl) return;
    const r = fn(tl, contentOf(zid));
    setTl(zid, r.tl);
    if (r.show) show(zid, r.show);
  };
  const edit = (zid, fn) => { const tl = tlOf(zid); if (tl) setTl(zid, fn(tl, contentOf(zid))); };

  // ---- dirty state + Changes highlight, for the board and every zone with steps
  const boardDirty = useMemo(() => TL.timelineDirty(board, { blocks, links }), [board, blocks, links]);
  const boardIndex = useMemo(
    () => (showChanges ? changeIndex(referenceStep(board.steps, TL.viewIndex(board), boardDirty)) : null),
    [board, boardDirty, showChanges],
  );
  const zoneInfo = useMemo(() => {
    const info = {};
    for (const z of zones) {
      const ids = zoneMembers(blocks, sizes, z);
      let dirty = false, index = null;
      if (z.steps.length) {
        dirty = TL.timelineDirty(z, zoneContent(blocks, links, ids));
        if (showChanges) index = changeIndex(referenceStep(z.steps, TL.viewIndex(z), dirty));
      }
      info[z.id] = { ids, dirty, index };
    }
    return info;
  }, [zones, blocks, links, sizes, showChanges]);

  // A block inside a zone with steps is compared against that zone's timeline, otherwise the board's.
  const indexFor = useMemo(() => {
    const m = {};
    for (const z of zones) {
      const inf = zoneInfo[z.id];
      if (inf.index) for (const id of inf.ids) if (!(id in m)) m[id] = inf.index;
    }
    return (id) => m[id] ?? boardIndex;
  }, [zones, zoneInfo, boardIndex]);

  const openZone = zones.find((z) => z.open)?.id ?? null;

  return {
    board, boardDirty, zones, zoneInfo, openZone, showChanges,
    dirtyOf: (zid) => (zid ? !!zoneInfo[zid]?.dirty : boardDirty),
    membersOf,

    // Changes highlight
    prevBlock: (id) => indexFor(id)?.blocks[id] ?? null,
    slotChanged: (id, slot) => slotChanged(indexFor(id), links, id, slot),
    linkChanged: (l) => linkChanged(indexFor(l.from), links, l),
    toggleChanges: () => setShowChanges((v) => !v),

    // Timeline actions (zid = null for the whole board)
    save: (zid) => edit(zid, TL.saveStep),
    load: (zid, id) => run(zid, (tl, c) => TL.loadStep(tl, id, c)),
    update: (zid) => edit(zid, TL.updateStep),
    patch: (zid, id, p) => edit(zid, (tl) => TL.patchStep(tl, id, p)),
    remove: (zid) => edit(zid, TL.deleteViewedStep),
    backToLive: (zid) => run(zid, (tl) => TL.backToLive(tl)),
    stepBy: (zid, d) => run(zid, (tl, c) => TL.stepBy(tl, d, c)),

    // Zones
    addZone: (rect) => setZones((zs) => [...zs.map((z) => ({ ...z, open: false })), createZone(rect, zs)]),
    updateZone: (id, p) => setZones((zs) => zs.map((z) => (z.id === id ? { ...z, ...p } : z))),
    deleteZone: (id) => setZones((zs) => zs.filter((z) => z.id !== id)),
    // After dragging a zone with its blocks: move what its steps remember by the same amount.
    shiftZoneSteps: (id, dx, dy) => setZones((zs) => zs.map((z) => (z.id === id ? shiftTimeline(z, dx, dy) : z))),
    // Only one zone shows its step bar at a time.
    toggleZone: (id) => setZones((zs) => zs.map((z) => ({ ...z, open: z.id === id ? !z.open : false }))),
    closeZones: () => setZones((zs) => (zs.some((z) => z.open) ? zs.map((z) => ({ ...z, open: false })) : zs)),

    // Board import
    reset: (steps = [], nextZones = []) => { setBoard({ steps, viewing: null, backup: null }); setZones(nextZones); },
  };
}
