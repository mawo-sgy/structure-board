// Pure helpers for the workspace tab list.

// Move tab `id` to just before (or after) `targetId`. Unknown ids leave the list unchanged.
export function moveTab(tabs, id, targetId, after) {
  const tab = tabs.find((t) => t.id === id);
  const rest = tabs.filter((t) => t.id !== id);
  let i = rest.findIndex((t) => t.id === targetId);
  if (!tab || i < 0) return tabs;
  if (after) i++;
  return [...rest.slice(0, i), tab, ...rest.slice(i)];
}

// "Board N" with the smallest N >= tabs.length + 1 that is not taken.
export function nextBoardName(tabs) {
  let n = tabs.length + 1;
  while (tabs.some((t) => t.name === `Board ${n}`)) n++;
  return `Board ${n}`;
}

// `base`, or "base 2", "base 3"… if that name is already used.
export function uniqueName(tabs, base) {
  if (!tabs.some((t) => t.name === base)) return base;
  let n = 2;
  while (tabs.some((t) => t.name === `${base} ${n}`)) n++;
  return `${base} ${n}`;
}
