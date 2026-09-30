// A step timeline: { steps, viewing, backup } — saved snapshots, the one being viewed, and the
// "live" content from before a step was opened. Used for the whole board and for each step zone
// (a zone object carries these three fields next to its own). Pure: every function returns a new
// timeline (other fields are kept) and, where the board must change, the content to show.
//
// "content" is { blocks, links } for the timeline's scope: the whole board, or one zone.
import { uid } from '../theme.js';
import { clone } from './model.js';
import { isDirty, stepTarget } from './steps.js';

export const emptyTimeline = () => ({ steps: [], viewing: null, backup: null });

export const viewIndex = (tl) => tl.steps.findIndex((s) => s.id === tl.viewing);
export const viewedStep = (tl) => tl.steps[viewIndex(tl)] || null;

// The content no longer matches the step being viewed.
export const timelineDirty = (tl, content) => isDirty(content.blocks, content.links, viewedStep(tl));

export function saveStep(tl, content) {
  const s = { id: uid(), label: '', note: '', ...clone({ blocks: content.blocks, links: content.links }) };
  return { ...tl, steps: [...tl.steps, s], viewing: s.id, backup: null };
}

// Open step `id`. The current content becomes the "live" backup when it is not a step yet
// (nothing viewed, or the viewed step was edited). Returns { tl, show }.
export function loadStep(tl, id, content) {
  const s = tl.steps.find((x) => x.id === id);
  if (!s) return { tl, show: null };
  const keep = !viewedStep(tl) || timelineDirty(tl, content);
  return {
    tl: { ...tl, viewing: id, backup: keep ? clone({ blocks: content.blocks, links: content.links }) : tl.backup },
    show: clone({ blocks: s.blocks, links: s.links }),
  };
}

// Overwrite the viewed step with the current content.
export function updateStep(tl, content) {
  const v = viewedStep(tl);
  if (!v) return tl;
  const c = clone({ blocks: content.blocks, links: content.links });
  return { ...tl, steps: tl.steps.map((s) => (s.id === v.id ? { ...s, ...c } : s)) };
}

export function patchStep(tl, id, p) {
  return { ...tl, steps: tl.steps.map((s) => (s.id === id ? { ...s, ...p } : s)) };
}

export function deleteViewedStep(tl) {
  const v = viewedStep(tl);
  if (!v) return tl;
  return { ...tl, steps: tl.steps.filter((s) => s.id !== v.id), viewing: null };
}

// Back to the content from before a step was opened. Returns { tl, show }.
export function backToLive(tl) {
  if (!tl.backup) return { tl, show: null };
  return { tl: { ...tl, backup: null, viewing: null }, show: tl.backup };
}

// ← / →. Returns { tl, show } (show is null when nothing changes).
export function stepBy(tl, d, content) {
  const t = stepTarget(tl.steps, viewIndex(tl), d, !!tl.backup);
  if (t?.load) return loadStep(tl, t.load, content);
  if (t?.live) return backToLive(tl);
  return { tl, show: null };
}
