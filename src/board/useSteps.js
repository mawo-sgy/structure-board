import { useState, useMemo } from 'react';
import { uid } from '../theme.js';
import { snap, isDirty, referenceStep, changeIndex, slotChanged, linkChanged, stepTarget } from './steps.js';

// Step timeline state: saved snapshots, which one is being viewed, the pre-step "live" backup,
// and the Changes highlight. `onLoad` runs whenever the board content is replaced.
export function useSteps({ initial, blocks, links, setBlocks, setLinks, onLoad }) {
  const [steps, setSteps] = useState(initial.steps || []);
  const [viewing, setViewing] = useState(initial.viewing || null);
  const [backup, setBackup] = useState(initial.backup || null);
  const [showChanges, setShowChanges] = useState(initial.showChanges ?? true);

  const viewIdx = steps.findIndex((s) => s.id === viewing);
  const viewStep = viewIdx >= 0 ? steps[viewIdx] : null;
  const dirty = useMemo(() => isDirty(blocks, links, viewStep), [blocks, links, viewStep]);
  const refStep = referenceStep(steps, viewIdx, dirty);
  const index = useMemo(() => (showChanges ? changeIndex(refStep) : null), [refStep, showChanges]);

  const show = (s) => { setBlocks(s.blocks); setLinks(s.links); onLoad?.(); };

  const save = () => {
    const s = { id: uid(), label: '', note: '', ...snap(blocks, links) };
    setSteps((ss) => [...ss, s]);
    setViewing(s.id);
    setBackup(null);
  };
  const load = (id) => {
    const s = steps.find((x) => x.id === id);
    if (!s) return;
    if (!viewStep || dirty) setBackup(snap(blocks, links));
    show(snap(s.blocks, s.links));
    setViewing(id);
  };
  const update = () => {
    if (!viewStep) return;
    const c = snap(blocks, links);
    setSteps((ss) => ss.map((s) => (s.id === viewStep.id ? { ...s, ...c } : s)));
  };
  const patch = (id, p) => setSteps((ss) => ss.map((s) => (s.id === id ? { ...s, ...p } : s)));
  const remove = () => {
    if (!viewStep) return;
    setSteps((ss) => ss.filter((s) => s.id !== viewStep.id));
    setViewing(null);
  };
  const backToLive = () => {
    if (!backup) return;
    show(backup);
    setBackup(null);
    setViewing(null);
  };
  const stepBy = (d) => {
    const t = stepTarget(steps, viewIdx, d, !!backup);
    if (t?.load) load(t.load);
    else if (t?.live) backToLive();
  };
  // Replace the whole timeline (board import).
  const reset = (next = []) => { setSteps(next); setViewing(null); setBackup(null); };

  return {
    steps, viewing, backup, showChanges, dirty,
    prevBlock: (id) => (index ? index.blocks[id] ?? null : null),
    slotChanged: (id, slot) => slotChanged(index, links, id, slot),
    linkChanged: (l) => linkChanged(index, links, l),
    save, load, update, patch, remove, backToLive, stepBy, reset,
    toggleChanges: () => setShowChanges((v) => !v),
  };
}
