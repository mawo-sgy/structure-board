import { useState, useEffect, useLayoutEffect, useRef, useMemo, useCallback } from 'react';
import { toPng } from 'html-to-image';
import { T, uid } from './theme.js';
import { edgePoint } from './geometry.js';
import { BLOCK_DEFS, createBlock } from './blocks/index.js';
import { BlockFrame } from './BlockFrame.jsx';
import { ArrowDefs, LinkArrow } from './LinkArrow.jsx';
import { Toolbar, StatusBar } from './Toolbar.jsx';
import { StepBar } from './StepBar.jsx';

const INTERACTIVE = 'input, textarea, button, select, [data-nodrag]';
const EDGE_PAD = 10;
const HISTORY_LIMIT = 100;
const CLIP_KEY = 'structure-board:clipboard';
// Pointer links start from a named slot inside a block (list next, pointer variable, struct field).
const slotOf = (l) => (l.next ? l.slot || 'next' : null);
const clone = (x) => JSON.parse(JSON.stringify(x));

function isTyping() {
  const a = document.activeElement;
  return !!a && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA' || a.tagName === 'SELECT' || a.isContentEditable);
}

// Clipboard for blocks. localStorage makes it work across tabs and browser windows;
// the module variable is the fallback when storage is unavailable.
let memClip = null;
let pasteCount = 0;
function readClip() {
  try { const raw = localStorage.getItem(CLIP_KEY); if (raw) return JSON.parse(raw); } catch { /* fall back */ }
  return memClip;
}
function writeClip(c) {
  memClip = c;
  pasteCount = 0;
  try { localStorage.setItem(CLIP_KEY, JSON.stringify(c)); } catch { /* quota / private mode */ }
}

export default function Board({ initial, name = 'board', onChange, tabBar }) {
  const [blocks, setBlocks] = useState(initial.blocks || []);
  const [links, setLinks] = useState(initial.links || []);
  const [view, setView] = useState(initial.view || { x: 0, y: 0, s: 1 });
  const [steps, setSteps] = useState(initial.steps || []);
  const [viewing, setViewing] = useState(initial.viewing || null);
  const [backup, setBackup] = useState(initial.backup || null);
  const [showChanges, setShowChanges] = useState(initial.showChanges ?? true);
  const [sel, setSel] = useState([]);
  const [sizes, setSizes] = useState({});
  const [, setMeasureTick] = useState(0);
  const [, setHistTick] = useState(0);
  const [draft, setDraft] = useState(null);
  const [box, setBox] = useState(null);
  const [exporting, setExporting] = useState(false);

  const canvasRef = useRef(null);
  const worldRef = useRef(null);
  const nodes = useRef({});
  const drag = useRef(null);
  const viewRef = useRef(view); viewRef.current = view;
  const blocksRef = useRef(blocks); blocksRef.current = blocks;
  const linksRef = useRef(links); linksRef.current = links;
  const sizesRef = useRef(sizes); sizesRef.current = sizes;
  const selRef = useRef(sel); selRef.current = sel;
  const roRef = useRef(null);
  if (!roRef.current && typeof ResizeObserver !== 'undefined') {
    roRef.current = new ResizeObserver(() => setMeasureTick((t) => t + 1));
  }

  // ---- persistence: report every change up; the workspace debounces the save
  const onChangeRef = useRef(onChange); onChangeRef.current = onChange;
  const firstRun = useRef(true);
  useEffect(() => {
    if (firstRun.current) { firstRun.current = false; return; }
    onChangeRef.current?.({ blocks, links, view, steps, viewing, backup, showChanges });
  }, [blocks, links, view, steps, viewing, backup, showChanges]);

  // ---- undo / redo over { blocks, links }.
  // `base` is the last committed state. Edits are committed after a 400ms pause (so a typing
  // burst is one entry) and drags are committed on pointer-up (so a drag is one entry).
  const hist = useRef(null);
  if (!hist.current) hist.current = { past: [], future: [], base: { blocks, links } };
  const commit = () => {
    const h = hist.current;
    const cur = { blocks: blocksRef.current, links: linksRef.current };
    if (cur.blocks === h.base.blocks && cur.links === h.base.links) return;
    h.past.push(h.base);
    if (h.past.length > HISTORY_LIMIT) h.past.shift();
    h.future = [];
    h.base = cur;
    setHistTick((t) => t + 1);
  };
  useEffect(() => {
    if (drag.current) return;
    const t = setTimeout(commit, 400);
    return () => clearTimeout(t);
  }, [blocks, links]);

  const restore = (from, to) => {
    commit();
    const h = hist.current;
    const s = h[from].pop();
    if (!s) return;
    h[to].push(h.base);
    h.base = s;
    setBlocks(s.blocks);
    setLinks(s.links);
    setSel([]);
    setHistTick((t) => t + 1);
  };
  const undo = () => restore('past', 'future');
  const redo = () => restore('future', 'past');
  const h = hist.current;
  const canUndo = h.past.length > 0 || blocks !== h.base.blocks || links !== h.base.links;
  const canRedo = h.future.length > 0 && blocks === h.base.blocks && links === h.base.links;

  // ---- measure rendered block sizes (height is content-driven) for arrows
  const registerRef = useCallback((id, el) => {
    const prev = nodes.current[id];
    if (prev === el) return;
    if (prev) roRef.current?.unobserve(prev);
    if (el) { nodes.current[id] = el; roRef.current?.observe(el); }
    else delete nodes.current[id];
  }, []);

  useLayoutEffect(() => {
    const next = {};
    let changed = false;
    for (const b of blocks) {
      const el = nodes.current[b.id];
      if (!el) continue;
      const s = { w: el.offsetWidth, h: el.offsetHeight };
      const slots = el.querySelectorAll('[data-slot]');
      if (slots.length) {
        const br = el.getBoundingClientRect();
        const k = el.offsetWidth / (br.width || 1);
        s.anchors = {};
        slots.forEach((a) => {
          const ar = a.getBoundingClientRect();
          s.anchors[a.getAttribute('data-slot')] = {
            x: Math.round(((ar.left + ar.width / 2) - br.left) * k),
            y: Math.round(((ar.top + ar.height / 2) - br.top) * k),
          };
        });
      }
      next[b.id] = s;
      const p = sizes[b.id];
      if (!p || p.w !== s.w || p.h !== s.h || JSON.stringify(p.anchors) !== JSON.stringify(s.anchors)) changed = true;
    }
    if (Object.keys(next).length !== Object.keys(sizes).length) changed = true;
    if (changed) setSizes(next);
  });

  // ---- view helpers
  const toWorld = (cx, cy) => {
    const r = canvasRef.current.getBoundingClientRect();
    const v = viewRef.current;
    return { x: (cx - r.left - v.x) / v.s, y: (cy - r.top - v.y) / v.s };
  };

  const zoomAt = (sx, sy, f) => setView((v) => {
    const s = Math.min(3, Math.max(0.2, v.s * f));
    const k = s / v.s;
    return { s, x: sx - (sx - v.x) * k, y: sy - (sy - v.y) * k };
  });

  const zoomCenter = (f) => {
    const r = canvasRef.current.getBoundingClientRect();
    zoomAt(r.width / 2, r.height / 2, f);
  };

  // World-space bounding box of a set of blocks (measured size, or a guess before first measure).
  const bboxOf = (bs) => {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const b of bs) {
      const s = sizesRef.current[b.id] || { w: 200, h: 80 };
      x0 = Math.min(x0, b.x); y0 = Math.min(y0, b.y);
      x1 = Math.max(x1, b.x + s.w); y1 = Math.max(y1, b.y + s.h);
    }
    return { x0, y0, x1, y1 };
  };

  const fitAll = () => {
    const bs = blocksRef.current;
    if (!bs.length || !canvasRef.current) return;
    const { x0, y0, x1, y1 } = bboxOf(bs);
    const r = canvasRef.current.getBoundingClientRect();
    const pad = 80;
    const s = Math.min(1.5, Math.max(0.2, Math.min(r.width / (x1 - x0 + pad * 2), r.height / (y1 - y0 + pad * 2))));
    setView({ s, x: r.width / 2 - ((x0 + x1) / 2) * s, y: r.height / 2 - ((y0 + y1) / 2) * s });
  };

  // ---- block operations
  const updateBlock = (id, p) => setBlocks((bs) => bs.map((b) => (b.id === id ? { ...b, ...p } : b)));

  const removeBlocks = (ids) => {
    if (!ids.length) return;
    const set = new Set(ids);
    setBlocks((bs) => bs.filter((b) => !set.has(b.id)));
    setLinks((ls) => ls.filter((l) => !set.has(l.from) && !set.has(l.to)));
    setSel([]);
  };

  // Deep copy of some blocks plus the links that stay inside the group.
  const cloneGroup = (ids) => {
    const set = new Set(ids);
    return clone({
      blocks: blocksRef.current.filter((b) => set.has(b.id)),
      links: linksRef.current.filter((l) => set.has(l.from) && set.has(l.to)),
    });
  };

  // Add a copied group with fresh ids, shifted by (dx, dy), and select it.
  const insertGroup = (g, dx, dy) => {
    const ids = {};
    const nb = g.blocks.filter((b) => BLOCK_DEFS[b.type]).map((b) => {
      ids[b.id] = uid();
      return { ...b, id: ids[b.id], x: Math.round(b.x + dx), y: Math.round(b.y + dy) };
    });
    const nl = (g.links || []).filter((l) => ids[l.from] && ids[l.to]).map((l) => ({ ...l, id: uid(), from: ids[l.from], to: ids[l.to] }));
    setBlocks((bs) => [...bs, ...nb]);
    setLinks((ls) => [...ls, ...nl]);
    setSel(nb.map((b) => b.id));
  };

  const duplicate = (ids) => { if (ids.length) insertGroup(cloneGroup(ids), 28, 28); };

  const copy = () => { if (selRef.current.length) writeClip(cloneGroup(selRef.current)); };

  // Paste next to the originals when they are on screen, otherwise in the middle of the view.
  const paste = () => {
    const c = readClip();
    if (!c?.blocks?.length || !canvasRef.current) return;
    const r = canvasRef.current.getBoundingClientRect();
    const v = viewRef.current;
    const vx0 = -v.x / v.s, vy0 = -v.y / v.s, vx1 = (r.width - v.x) / v.s, vy1 = (r.height - v.y) / v.s;
    const xs = c.blocks.map((b) => b.x), ys = c.blocks.map((b) => b.y);
    const gx = (Math.min(...xs) + Math.max(...xs)) / 2, gy = (Math.min(...ys) + Math.max(...ys)) / 2;
    pasteCount += 1;
    if (gx > vx0 && gx < vx1 && gy > vy0 && gy < vy1) insertGroup(c, 28 * pasteCount, 28 * pasteCount);
    else insertGroup(c, (vx0 + vx1) / 2 - gx - 90, (vy0 + vy1) / 2 - gy - 40);
  };

  const addBlock = (type) => {
    const def = BLOCK_DEFS[type];
    const r = canvasRef.current.getBoundingClientRect();
    const v = viewRef.current;
    const cx = (r.width / 2 - v.x) / v.s, cy = (r.height / 2 - v.y) / v.s;
    const j = () => (Math.random() - 0.5) * 40;
    const b = createBlock(type, cx - (def.w || 180) / 2 + j(), cy - 50 + j());
    setBlocks((bs) => [...bs, b]);
    setSel([b.id]);
  };

  // ---- steps (snapshots of blocks + links)
  const snap = (bs, ls) => clone({ blocks: bs, links: ls });
  const viewIdx = steps.findIndex((s) => s.id === viewing);
  const viewStep = viewIdx >= 0 ? steps[viewIdx] : null;
  const dirty = useMemo(
    () => !!viewStep && JSON.stringify({ blocks, links }) !== JSON.stringify({ blocks: viewStep.blocks, links: viewStep.links }),
    [blocks, links, viewStep],
  );
  // Compare against the previous step while viewing a step, otherwise against the step you started from.
  const refStep = viewStep ? (dirty ? viewStep : steps[viewIdx - 1]) : steps[steps.length - 1];
  const prevMap = useMemo(() => {
    if (!showChanges || !refStep) return null;
    const m = {};
    for (const b of refStep.blocks) m[b.id] = b;
    return m;
  }, [refStep, showChanges]);
  // Where each pointer slot / plain link pointed in the reference step.
  const prevLinks = useMemo(() => {
    if (!prevMap) return null;
    const m = {};
    for (const l of refStep.links) {
      const s = slotOf(l);
      m[s ? `${l.from}|${s}` : `${l.from}>${l.to}`] = l.to;
    }
    return m;
  }, [prevMap, refStep]);
  const slotChanged = (id, slot) => {
    if (!prevLinks || !prevMap[id]) return false;
    const cur = links.find((l) => l.from === id && slotOf(l) === slot)?.to ?? null;
    return cur !== (prevLinks[`${id}|${slot}`] ?? null);
  };
  const linkChanged = (l) => {
    if (!prevLinks || !prevMap[l.from]) return false;
    const s = slotOf(l);
    return s ? slotChanged(l.from, s) : !(`${l.from}>${l.to}` in prevLinks);
  };

  const saveStep = () => {
    const s = { id: uid(), label: '', note: '', ...snap(blocks, links) };
    setSteps((ss) => [...ss, s]);
    setViewing(s.id);
    setBackup(null);
  };
  const loadStep = (id) => {
    const s = steps.find((x) => x.id === id);
    if (!s) return;
    if (!viewStep || dirty) setBackup(snap(blocks, links));
    const c = snap(s.blocks, s.links);
    setBlocks(c.blocks);
    setLinks(c.links);
    setViewing(id);
    setSel([]);
  };
  const updateStep = () => {
    if (!viewStep) return;
    const c = snap(blocks, links);
    setSteps((ss) => ss.map((s) => (s.id === viewStep.id ? { ...s, ...c } : s)));
  };
  const patchStep = (id, p) => setSteps((ss) => ss.map((s) => (s.id === id ? { ...s, ...p } : s)));
  const deleteStep = () => {
    if (!viewStep) return;
    setSteps((ss) => ss.filter((s) => s.id !== viewStep.id));
    setViewing(null);
  };
  const backToLive = () => {
    if (!backup) return;
    setBlocks(backup.blocks);
    setLinks(backup.links);
    setBackup(null);
    setViewing(null);
    setSel([]);
  };
  const stepBy = (d) => {
    if (!steps.length) return;
    if (viewIdx < 0) { if (d < 0) loadStep(steps[steps.length - 1].id); return; }
    const i = viewIdx + d;
    if (i >= 0 && i < steps.length) loadStep(steps[i].id);
    else if (i >= steps.length && backup) backToLive();
  };

  // ---- import / export
  const download = (href, filename) => {
    const a = document.createElement('a');
    a.href = href;
    a.download = filename;
    a.click();
  };
  const fileBase = (name || 'board').trim().replace(/[^\w\- ]+/g, '').replace(/\s+/g, '-').toLowerCase() || 'board';

  const exportBoard = () => {
    const blob = new Blob([JSON.stringify({ blocks, links, view, steps }, null, 2)], { type: 'application/json' });
    const href = URL.createObjectURL(blob);
    download(href, `${fileBase}.json`);
    setTimeout(() => URL.revokeObjectURL(href), 1000);
  };

  const importBoard = (file) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const d = JSON.parse(reader.result);
        if (!Array.isArray(d.blocks)) throw new Error('missing blocks');
        setBlocks(d.blocks.filter((b) => BLOCK_DEFS[b.type]));
        setLinks(Array.isArray(d.links) ? d.links : []);
        setSteps(Array.isArray(d.steps) ? d.steps : []);
        setViewing(null);
        setBackup(null);
        if (d.view) setView(d.view);
        setSel([]);
      } catch (err) {
        alert('Could not import that file: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  // PNG of every block at 2x. Selection chrome and hover controls are marked data-noexport;
  // [data-exporting] hides them (CSS rule in index.html) during capture. Arrow × targets are
  // SVG, which html-to-image clones without computed styles, so they are not rendered at all.
  const exportImage = async () => {
    const bs = blocksRef.current;
    if (!bs.length || !worldRef.current) return;
    setSel([]);
    setExporting(true);
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    const pad = 40;
    const { x0, y0, x1, y1 } = bboxOf(bs);
    const world = worldRef.current;
    world.setAttribute('data-exporting', '');
    try {
      const url = await toPng(worldRef.current, {
        width: Math.ceil(x1 - x0 + pad * 2),
        height: Math.ceil(y1 - y0 + pad * 2),
        pixelRatio: 2,
        backgroundColor: T.bg,
        style: { transform: `translate(${pad - x0}px, ${pad - y0}px)` },
      });
      download(url, `${fileBase}.png`);
    } catch (err) {
      alert('Could not export the image: ' + (err?.message || err));
    } finally {
      world.removeAttribute('data-exporting');
      setExporting(false);
    }
  };

  // Latest versions of the actions, for the listeners registered once below.
  const act = useRef(null);
  act.current = { undo, redo, commit, copy, paste, duplicate, removeBlocks, stepBy, saveStep, fitAll };

  // ---- pointer: pan / move / resize / link / box-select
  useEffect(() => {
    const move = (e) => {
      const d = drag.current;
      if (!d) return;
      const v = viewRef.current;
      if (d.kind === 'pan') {
        setView((p) => ({ ...p, x: d.vx + e.clientX - d.sx, y: d.vy + e.clientY - d.sy }));
      } else if (d.kind === 'move') {
        if (!d.moved && Math.hypot(e.clientX - d.sx, e.clientY - d.sy) < 3) return;
        d.moved = true;
        const dx = (e.clientX - d.sx) / v.s, dy = (e.clientY - d.sy) / v.s;
        setBlocks((bs) => bs.map((b) => {
          const s = d.starts[b.id];
          return s ? { ...b, x: Math.round(s.x + dx), y: Math.round(s.y + dy) } : b;
        }));
      } else if (d.kind === 'resize') {
        const w = Math.max(150, Math.round(d.bw + (e.clientX - d.sx) / v.s));
        setBlocks((bs) => bs.map((b) => (b.id === d.id ? { ...b, w } : b)));
      } else if (d.kind === 'link') {
        const p = toWorld(e.clientX, e.clientY);
        setDraft({ from: d.id, x: p.x, y: p.y, slot: d.slot });
      } else if (d.kind === 'box') {
        const p = toWorld(e.clientX, e.clientY);
        const b = { x0: Math.min(d.x, p.x), y0: Math.min(d.y, p.y), x1: Math.max(d.x, p.x), y1: Math.max(d.y, p.y) };
        setBox(b);
        const hits = blocksRef.current.filter((k) => {
          const s = sizesRef.current[k.id];
          return s && k.x < b.x1 && k.x + s.w > b.x0 && k.y < b.y1 && k.y + s.h > b.y0;
        }).map((k) => k.id);
        setSel([...new Set([...d.base, ...hits])]);
      }
    };
    const up = (e) => {
      const d = drag.current;
      drag.current = null;
      document.body.style.cursor = '';
      if (!d) return;
      if (d.kind === 'move') {
        if (d.moved) setTimeout(() => act.current.commit(), 0);
        else if (d.collapseTo) setSel([d.collapseTo]);
      } else if (d.kind === 'resize') {
        setTimeout(() => act.current.commit(), 0);
      } else if (d.kind === 'box') {
        setBox(null);
      } else if (d.kind === 'link') {
        const el = document.elementFromPoint(e.clientX, e.clientY)?.closest('[data-block-id]');
        const to = el?.getAttribute('data-block-id');
        if (to && to !== d.id) {
          setLinks((ls) => {
            if (d.slot) return [...ls.filter((l) => !(l.from === d.id && slotOf(l) === d.slot)), { id: uid(), from: d.id, to, next: true, slot: d.slot }];
            return ls.some((l) => l.from === d.id && l.to === to) ? ls : [...ls, { id: uid(), from: d.id, to }];
          });
        }
        setDraft(null);
      }
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    return () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
  }, []);

  // ---- wheel: Ctrl/Cmd zooms at cursor, plain wheel pans
  useEffect(() => {
    const el = canvasRef.current;
    const onWheel = (e) => {
      e.preventDefault();
      const r = el.getBoundingClientRect();
      if (e.ctrlKey || e.metaKey) zoomAt(e.clientX - r.left, e.clientY - r.top, Math.exp(-e.deltaY * 0.0015));
      else setView((v) => ({ ...v, x: v.x - e.deltaX, y: v.y - e.deltaY }));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  // ---- keyboard
  useEffect(() => {
    const onKey = (e) => {
      const a = act.current;
      const mod = (e.ctrlKey || e.metaKey) && !e.altKey;
      const k = e.key.toLowerCase();
      const typing = isTyping();

      // Undo/redo also works while typing inside a block; inputs outside the board
      // (tab names, step notes) keep their native undo.
      if (mod && (k === 'z' || k === 'y')) {
        if (typing && !document.activeElement.closest('[data-block-id]')) return;
        e.preventDefault();
        if (k === 'y' || e.shiftKey) a.redo(); else a.undo();
        return;
      }
      if (e.key === 'Escape') {
        if (typing) document.activeElement.blur();
        setSel([]);
        return;
      }
      if (typing) return;
      const ids = selRef.current;

      if (mod) {
        if (k === 'c' && ids.length) { e.preventDefault(); a.copy(); }
        else if (k === 'x' && ids.length) { e.preventDefault(); a.copy(); a.removeBlocks(ids); }
        else if (k === 'v' && readClip()?.blocks?.length) { e.preventDefault(); a.paste(); }
        else if (k === 'd' && ids.length) { e.preventDefault(); a.duplicate(ids); }
        else if (k === 'a') { e.preventDefault(); setSel(blocksRef.current.map((b) => b.id)); }
        return;
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && ids.length) {
        e.preventDefault();
        a.removeBlocks(ids);
      } else if (k === 'f' && !e.altKey) {
        a.fitAll();
      } else if (k === 's' && !e.altKey) {
        a.saveStep();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        a.stepBy(e.key === 'ArrowLeft' ? -1 : 1);
      }
    };
    // Inside a block the board's undo owns Ctrl+Z; stop the input's own undo from also running.
    const onBeforeInput = (e) => {
      if ((e.inputType === 'historyUndo' || e.inputType === 'historyRedo') && e.target.closest?.('[data-block-id]')) e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('beforeinput', onBeforeInput, true);
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('beforeinput', onBeforeInput, true); };
  }, []);

  const onCanvasDown = (e) => {
    if (e.target !== canvasRef.current || e.button !== 0) return;
    if (isTyping()) document.activeElement.blur();
    if (e.shiftKey) {
      const p = toWorld(e.clientX, e.clientY);
      drag.current = { kind: 'box', x: p.x, y: p.y, base: selRef.current };
      setBox({ x0: p.x, y0: p.y, x1: p.x, y1: p.y });
      return;
    }
    setSel([]);
    drag.current = { kind: 'pan', sx: e.clientX, sy: e.clientY, vx: view.x, vy: view.y };
    document.body.style.cursor = 'grabbing';
  };

  // Click selects; shift-click adds/removes; dragging a selected block moves the whole selection.
  const frameDown = (b) => (e) => {
    if (e.button !== 0) return;
    const cur = selRef.current;
    const onInput = !!e.target.closest(INTERACTIVE);
    let ids = cur, collapseTo = null;
    if (e.shiftKey && !onInput) {
      if (cur.includes(b.id)) { e.preventDefault(); setSel(cur.filter((x) => x !== b.id)); return; }
      ids = [...cur, b.id];
    } else if (onInput || !cur.includes(b.id)) {
      ids = [b.id];
    } else if (cur.length > 1) {
      collapseTo = b.id;
    }
    if (ids !== cur) setSel(ids);
    if (onInput) return;
    e.preventDefault();
    if (isTyping()) document.activeElement.blur();
    const starts = {};
    for (const x of blocksRef.current) if (ids.includes(x.id)) starts[x.id] = { x: x.x, y: x.y };
    drag.current = { kind: 'move', starts, collapseTo, sx: e.clientX, sy: e.clientY };
  };

  const resizeDown = (b) => (e) => {
    e.stopPropagation(); e.preventDefault();
    setSel([b.id]);
    drag.current = { kind: 'resize', id: b.id, sx: e.clientX, bw: nodes.current[b.id]?.offsetWidth || b.w || 200 };
    document.body.style.cursor = 'ew-resize';
  };

  const connectDown = (b, slot = null) => (e) => {
    if (e.button !== 0) return;
    e.stopPropagation(); e.preventDefault();
    if (isTyping()) document.activeElement.blur();
    setSel([b.id]);
    drag.current = { kind: 'link', id: b.id, slot };
    const p = toWorld(e.clientX, e.clientY);
    setDraft({ from: b.id, x: p.x, y: p.y, slot });
    document.body.style.cursor = 'crosshair';
  };

  // ---- arrow geometry
  const rectOf = (id) => {
    const b = blocks.find((x) => x.id === id);
    const s = sizes[id];
    return b && s ? { x: b.x, y: b.y, w: s.w, h: s.h } : null;
  };
  const center = (r) => ({ x: r.x + r.w / 2, y: r.y + r.h / 2 });
  const clearSlot = (id, slot) => setLinks((ls) => ls.filter((l) => !(l.from === id && slotOf(l) === slot)));
  const pointerApi = (b) => ({
    isLinked: (slot) => links.some((l) => l.from === b.id && slotOf(l) === slot),
    changed: (slot) => slotChanged(b.id, slot),
    start: (slot) => connectDown(b, slot),
    clear: (slot) => clearSlot(b.id, slot),
    // Create a new block of the same type at (dx, dy) and point `slot` at it.
    spawn: (slot, dx, dy) => {
      const nb = createBlock(b.type, b.x + dx, b.y + dy);
      setBlocks((bs) => [...bs, nb]);
      setLinks((ls) => [...ls.filter((l) => !(l.from === b.id && slotOf(l) === slot)), { id: uid(), from: b.id, to: nb.id, next: true, slot }]);
      setSel([nb.id]);
    },
  });

  const anchorOf = (id, slot) => {
    const b = blocks.find((x) => x.id === id), a = sizes[id]?.anchors?.[slot];
    return b && a ? { x: b.x + a.x, y: b.y + a.y } : null;
  };

  const arrows = links.map((l) => {
    const a = rectOf(l.from), b = rectOf(l.to);
    if (!a || !b) return null;
    const slot = slotOf(l);
    const anc = slot ? anchorOf(l.from, slot) : null;
    const ca = anc || center(a), cb = center(b);
    return { id: l.id, startDot: !!anc, changed: linkChanged(l), p1: anc || edgePoint(a, cb.x, cb.y, EDGE_PAD), p2: edgePoint(b, ca.x, ca.y, EDGE_PAD) };
  }).filter(Boolean);

  let draftArrow = null;
  if (draft) {
    const a = rectOf(draft.from);
    const anc = draft.slot ? anchorOf(draft.from, draft.slot) : null;
    if (a) draftArrow = { startDot: !!anc, p1: anc || edgePoint(a, draft.x, draft.y, EDGE_PAD), p2: { x: draft.x, y: draft.y } };
  }

  const grid = 22 * view.s;
  const solo = sel.length === 1 ? sel[0] : null;

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: T.bg, fontFamily: T.sans, color: T.ink }}>
      <Toolbar
        onAdd={addBlock}
        zoom={view.s}
        onZoomIn={() => zoomCenter(1.2)}
        onZoomOut={() => zoomCenter(1 / 1.2)}
        onReset={() => setView({ x: 0, y: 0, s: 1 })}
        onUndo={undo}
        onRedo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
        onExport={exportBoard}
        onExportImage={exportImage}
        onImport={importBoard}
      />

      <div
        ref={canvasRef}
        onPointerDown={onCanvasDown}
        style={{
          flex: 1, position: 'relative', overflow: 'hidden', touchAction: 'none',
          backgroundColor: T.bg,
          backgroundImage: `radial-gradient(${T.dot} 1.1px, transparent 1.4px)`,
          backgroundSize: `${grid}px ${grid}px`,
          backgroundPosition: `${view.x}px ${view.y}px`,
        }}
      >
        <div ref={worldRef} style={{ position: 'absolute', left: 0, top: 0, transformOrigin: '0 0', transform: `translate(${view.x}px, ${view.y}px) scale(${view.s})` }}>
          <svg style={{ position: 'absolute', left: 0, top: 0, width: 1, height: 1, overflow: 'visible', pointerEvents: 'none', zIndex: 0 }}>
            <ArrowDefs />
            {arrows.map((a) => (
              <LinkArrow key={a.id} p1={a.p1} p2={a.p2} startDot={a.startDot} changed={a.changed}
                onDelete={exporting ? null : () => setLinks((ls) => ls.filter((l) => l.id !== a.id))} />
            ))}
            {draftArrow && <LinkArrow p1={draftArrow.p1} p2={draftArrow.p2} startDot={draftArrow.startDot} draft />}
          </svg>

          {blocks.map((b) => {
            const def = BLOCK_DEFS[b.type];
            if (!def) return null;
            const Body = def.Body;
            return (
              <BlockFrame
                key={b.id}
                block={b}
                selected={sel.includes(b.id)}
                solo={solo === b.id}
                registerRef={registerRef}
                onFrameDown={frameDown(b)}
                onResizeDown={resizeDown(b)}
                onConnectDown={connectDown(b)}
                onColor={(color) => updateBlock(b.id, { color })}
                onDuplicate={() => duplicate([b.id])}
                onDelete={() => removeBlocks([b.id])}
              >
                {(active) => <Body block={b} patch={(p) => updateBlock(b.id, p)} active={active}
                  prev={prevMap ? prevMap[b.id] ?? null : null}
                  pointer={pointerApi(b)} />}
              </BlockFrame>
            );
          })}

          {box && (
            <div style={{
              position: 'absolute', left: box.x0, top: box.y0, width: box.x1 - box.x0, height: box.y1 - box.y0,
              border: `${1 / view.s}px dashed ${T.select}`, background: 'rgba(143,169,214,0.08)', pointerEvents: 'none', zIndex: 20,
            }} />
          )}
        </div>

        <StepBar
          steps={steps}
          viewingId={viewing}
          dirty={dirty}
          hasBackup={!!backup}
          showChanges={showChanges}
          onSave={saveStep}
          onLoad={loadStep}
          onUpdate={updateStep}
          onDelete={deleteStep}
          onLive={backToLive}
          onPrev={() => stepBy(-1)}
          onNext={() => stepBy(1)}
          onToggleChanges={() => setShowChanges((v) => !v)}
          onRename={(id, label) => patchStep(id, { label })}
          onNote={(id, note) => patchStep(id, { note })}
        />
      </div>

      {tabBar}
      <StatusBar blockCount={blocks.length} linkCount={links.length} selCount={sel.length} />
    </div>
  );
}
