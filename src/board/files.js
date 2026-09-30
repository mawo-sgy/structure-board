// Import/export: JSON board files, PNG capture, downloads.
import { toPng } from 'html-to-image';

// "My Board #2" → "my-board-2"
export function fileBase(name) {
  return (name || 'board').trim().replace(/[^\w\- ]+/g, '').replace(/\s+/g, '-').toLowerCase() || 'board';
}

export function download(href, filename) {
  const a = document.createElement('a');
  a.href = href;
  a.download = filename;
  a.click();
}

export function serializeBoard({ blocks, links, view, steps, zones = [] }) {
  return JSON.stringify({ blocks, links, view, steps, zones }, null, 2);
}

export function downloadJson(text, filename) {
  const href = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  download(href, filename);
  setTimeout(() => URL.revokeObjectURL(href), 1000);
}

// Parse an exported board file. Throws with a readable message if it is not one.
// Blocks of unknown types are dropped; missing links/steps/zones become empty; view may be null.
export function parseBoardFile(text, isKnownType = () => true) {
  const d = JSON.parse(text);
  if (!d || !Array.isArray(d.blocks)) throw new Error('missing blocks');
  return {
    blocks: d.blocks.filter((b) => isKnownType(b.type)),
    links: Array.isArray(d.links) ? d.links : [],
    steps: Array.isArray(d.steps) ? d.steps : [],
    zones: Array.isArray(d.zones) ? d.zones.map((z) => ({ ...z, open: false, viewing: null, backup: null })) : [],
    view: d.view || null,
  };
}

export function readFileText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

// PNG (2x) of the world layer, cropped to bbox + pad. Elements marked data-noexport are hidden
// by the [data-exporting] rule in index.html while the capture runs.
export async function capturePng(worldEl, bbox, background, pad = 40) {
  worldEl.setAttribute('data-exporting', '');
  try {
    return await toPng(worldEl, {
      width: Math.ceil(bbox.x1 - bbox.x0 + pad * 2),
      height: Math.ceil(bbox.y1 - bbox.y0 + pad * 2),
      pixelRatio: 2,
      backgroundColor: background,
      style: { transform: `translate(${pad - bbox.x0}px, ${pad - bbox.y0}px)` },
    });
  } finally {
    worldEl.removeAttribute('data-exporting');
  }
}
