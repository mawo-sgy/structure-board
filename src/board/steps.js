// Pure helpers for steps (snapshots of blocks + links) and the Changes highlight.
import { clone, slotOf } from './model.js';

export const snap = (blocks, links) => clone({ blocks, links });

// The board no longer matches the step it was loaded from.
export function isDirty(blocks, links, step) {
  return !!step && JSON.stringify({ blocks, links }) !== JSON.stringify({ blocks: step.blocks, links: step.links });
}

// Step the Changes highlight compares against: while viewing a step, the previous step
// (or the viewed step itself once you edit it); otherwise the last step saved.
export function referenceStep(steps, viewIdx, dirty) {
  if (viewIdx >= 0) return dirty ? steps[viewIdx] : steps[viewIdx - 1];
  return steps[steps.length - 1];
}

// Lookup tables for a reference step: blocks by id, and where each pointer slot
// ("from|slot") or plain link ("from>to") pointed.
export function changeIndex(step) {
  if (!step) return null;
  const blocks = {}, links = {};
  for (const b of step.blocks) blocks[b.id] = b;
  for (const l of step.links) {
    const s = slotOf(l);
    links[s ? `${l.from}|${s}` : `${l.from}>${l.to}`] = l.to;
  }
  return { blocks, links };
}

// A slot points somewhere else than in the reference step (including to/from NULL).
// Blocks that did not exist in the reference step are never "changed".
export function slotChanged(index, links, id, slot) {
  if (!index || !index.blocks[id]) return false;
  const cur = links.find((l) => l.from === id && slotOf(l) === slot)?.to ?? null;
  return cur !== (index.links[`${id}|${slot}`] ?? null);
}

export function linkChanged(index, links, l) {
  if (!index || !index.blocks[l.from]) return false;
  const s = slotOf(l);
  return s ? slotChanged(index, links, l.from, s) : !(`${l.from}>${l.to}` in index.links);
}

// What ←/→ should do: { load: stepId }, { live: true } (back to the pre-step board), or null.
export function stepTarget(steps, viewIdx, d, hasBackup) {
  if (!steps.length) return null;
  if (viewIdx < 0) return d < 0 ? { load: steps[steps.length - 1].id } : null;
  const i = viewIdx + d;
  if (i >= 0 && i < steps.length) return { load: steps[i].id };
  if (i >= steps.length && hasBackup) return { live: true };
  return null;
}
