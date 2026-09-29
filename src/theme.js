export const T = {
  bg: '#f5f4f0',
  dot: '#cfcbc2',
  ink: '#24221e',
  muted: '#8a857b',
  faint: '#b8b3a8',
  line: '#4b4841',
  rule: '#e2dfd7',
  chrome: '#fbfaf7',
  type: '#3d6b9c',
  select: '#8fa9d6',
  changed: 'rgba(214,165,38,0.32)',
  mono: "'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
  sans: "'IBM Plex Sans', system-ui, -apple-system, sans-serif",
};

export const COLORS = {
  blue:   { dot: '#4a7fd0', wash: 'rgba(74,127,208,0.09)', border: 'rgba(74,127,208,0.55)', paper: '#cfe0f6' },
  green:  { dot: '#3f9a66', wash: 'rgba(63,154,102,0.09)', border: 'rgba(63,154,102,0.55)', paper: '#cdebd3' },
  red:    { dot: '#d0564d', wash: 'rgba(208,86,77,0.08)',  border: 'rgba(208,86,77,0.55)',  paper: '#f6d0cb' },
  yellow: { dot: '#d6a526', wash: 'rgba(214,165,38,0.12)', border: 'rgba(214,165,38,0.65)', paper: '#fbe7a1' },
};

export const COLOR_KEYS = ['blue', 'green', 'red', 'yellow'];

export const inputReset = {
  border: 'none', background: 'transparent', outline: 'none', padding: 0, margin: 0,
  font: 'inherit', color: 'inherit', minWidth: 0,
};

export const cellStyle = {
  ...inputReset,
  width: 46, height: 38, boxSizing: 'border-box',
  border: `1.5px solid ${T.line}`, textAlign: 'center', fontSize: 14, fontFamily: T.mono,
};

export const uid = () => Math.random().toString(36).slice(2, 10);
