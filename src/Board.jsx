import { useState, useEffect, useRef } from 'react';
import { T } from './theme.js';
import { BLOCK_DEFS, createBlock } from './blocks/index.js';
import { BlockFrame } from './BlockFrame.jsx';
import { ArrowDefs, LinkArrow } from './LinkArrow.jsx';
import { Toolbar, StatusBar } from './Toolbar.jsx';
import { StepBar } from './StepBar.jsx';
import { ContextMenu } from './ContextMenu.jsx';
import { removeBlocks, cloneGroup, instantiateGroup, bboxOf, pasteOffset, offsetTo, setSlot, clearSlot, slotOf } from './board/model.js';
import { buildArrows, buildDraftArrow } from './board/arrows.js';
import { readClip, writeClip, hasClip, nextPasteCount } from './board/clipboard.js';
import { fileBase, download, serializeBoard, downloadJson, parseBoardFile, readFileText, capturePng } from './board/files.js';
import { useViewport } from './board/useViewport.js';
import { useMeasure } from './board/useMeasure.js';
import { useSteps } from './board/useSteps.js';
import { useHistory } from './board/useHistory.js';
import { useDrag } from './board/useDrag.js';
import { useBoardKeys } from './board/useBoardKeys.js';

const isKnownType = (t) => !!BLOCK_DEFS[t];

// One board (tab): owns blocks, links and the selection, wires the hooks in ./board together,
// and renders the canvas. Pure logic lives in ./board/*.js, stateful pieces in ./board/use*.js.
export default function Board({ initial, name = 'board', onChange, tabBar }) {
  const [blocks, setBlocks] = useState(initial.blocks || []);
  const [links, setLinks] = useState(initial.links || []);
  const [sel, setSel] = useState([]);
  const [exporting, setExporting] = useState(false);
  const [menu, setMenu] = useState(null); // right-click menu: { x, y } in canvas px, world: { x, y }

  const canvasRef = useRef(null);
  const worldRef = useRef(null);
  const drag = useRef(null);
  const blocksRef = useRef(blocks); blocksRef.current = blocks;
  const linksRef = useRef(links); linksRef.current = links;
  const selRef = useRef(sel); selRef.current = sel;

  const { view, setView, viewRef, toWorld, visibleRect, zoomCenter, fitTo } = useViewport(initial.view, canvasRef);
  const { sizes, sizesRef, nodes, registerRef } = useMeasure(blocks);
  const steps = useSteps({ initial, blocks, links, setBlocks, setLinks, onLoad: () => setSel([]) });
  const history = useHistory({ blocks, links, setBlocks, setLinks, isDragging: () => !!drag.current, onRestore: () => setSel([]) });
  const { draft, box, onCanvasDown, frameDown, resizeDown, connectDown } = useDrag(drag, {
    canvasRef, viewRef, blocksRef, sizesRef, selRef, nodes, toWorld,
    setView, setBlocks, setLinks, setSel, commit: history.commit,
  });

  // ---- persistence: report every change up; the workspace debounces the save
  const onChangeRef = useRef(onChange); onChangeRef.current = onChange;
  const firstRun = useRef(true);
  const { steps: stepList, viewing, backup, showChanges } = steps;
  useEffect(() => {
    if (firstRun.current) { firstRun.current = false; return; }
    onChangeRef.current?.({ blocks, links, view, steps: stepList, viewing, backup, showChanges });
  }, [blocks, links, view, stepList, viewing, backup, showChanges]);

  // ---- block operations
  const updateBlock = (id, p) => setBlocks((bs) => bs.map((b) => (b.id === id ? { ...b, ...p } : b)));

  // Discrete actions (remove, insert) first commit any pending edit, so each is its own undo step
  // even when it follows another change within the 400ms history pause.
  const remove = (ids) => {
    if (!ids.length) return;
    history.commit();
    const r = removeBlocks(blocksRef.current, linksRef.current, ids);
    setBlocks(r.blocks);
    setLinks(r.links);
    setSel([]);
  };

  // Add a copied group with fresh ids, shifted by (dx, dy), and select it.
  const insert = (group, dx, dy) => {
    history.commit();
    const g = instantiateGroup(group, dx, dy, isKnownType);
    setBlocks((bs) => [...bs, ...g.blocks]);
    setLinks((ls) => [...ls, ...g.links]);
    setSel(g.blocks.map((b) => b.id));
  };

  const group = (ids) => cloneGroup(blocksRef.current, linksRef.current, ids);
  const duplicate = (ids) => { if (ids.length) insert(group(ids), 28, 28); };
  const copy = () => { if (selRef.current.length) writeClip(group(selRef.current)); };
  const paste = () => {
    const c = readClip();
    if (!c?.blocks?.length || !canvasRef.current) return;
    const { dx, dy } = pasteOffset(c.blocks, visibleRect(), nextPasteCount());
    insert(c, dx, dy);
  };
  const pasteAt = (p) => {
    const c = readClip();
    if (!c?.blocks?.length) return;
    const { dx, dy } = offsetTo(c.blocks, p);
    insert(c, dx, dy);
  };
  const cut = () => { copy(); remove(selRef.current); };
  const selectAll = () => setSel(blocksRef.current.map((b) => b.id));

  const addBlock = (type) => {
    const def = BLOCK_DEFS[type];
    const v = visibleRect();
    const j = () => (Math.random() - 0.5) * 40;
    const b = createBlock(type, (v.x0 + v.x1) / 2 - (def.w || 180) / 2 + j(), (v.y0 + v.y1) / 2 - 50 + j());
    setBlocks((bs) => [...bs, b]);
    setSel([b.id]);
  };

  const fitAll = () => { if (blocksRef.current.length) fitTo(bboxOf(blocksRef.current, sizesRef.current)); };

  // ---- import / export
  const base = fileBase(name);
  const exportJson = () => downloadJson(serializeBoard({ blocks, links, view, steps: stepList }), `${base}.json`);

  const importFile = async (file) => {
    try {
      const d = parseBoardFile(await readFileText(file), isKnownType);
      setBlocks(d.blocks);
      setLinks(d.links);
      steps.reset(d.steps);
      if (d.view) setView(d.view);
      setSel([]);
    } catch (err) {
      alert('Could not import that file: ' + err.message);
    }
  };

  // Selection chrome and hover controls are hidden via data-noexport. Arrow × targets are SVG,
  // which html-to-image clones without computed styles, so they are not rendered while exporting.
  const exportImage = async () => {
    const bs = blocksRef.current;
    if (!bs.length || !worldRef.current) return;
    setSel([]);
    setExporting(true);
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    try {
      download(await capturePng(worldRef.current, bboxOf(bs, sizesRef.current), T.bg), `${base}.png`);
    } catch (err) {
      alert('Could not export the image: ' + (err?.message || err));
    } finally {
      setExporting(false);
    }
  };

  useBoardKeys({
    undo: history.undo,
    redo: history.redo,
    copy,
    cut,
    paste,
    canPaste: hasClip,
    duplicate: () => duplicate(selRef.current),
    remove: () => remove(selRef.current),
    selectAll,
    deselect: () => { setSel([]); setMenu(null); },
    hasSelection: () => selRef.current.length > 0,
    fitAll,
    saveStep: steps.save,
    stepBy: steps.stepBy,
  });

  // ---- what block bodies use to draw and edit pointers
  const pointerApi = (b) => ({
    isLinked: (slot) => links.some((l) => l.from === b.id && slotOf(l) === slot),
    changed: (slot) => steps.slotChanged(b.id, slot),
    start: (slot) => connectDown(b, slot),
    clear: (slot) => setLinks((ls) => clearSlot(ls, b.id, slot)),
    // Create a new block of the same type at (dx, dy) and point `slot` at it.
    spawn: (slot, dx, dy) => {
      const nb = createBlock(b.type, b.x + dx, b.y + dy);
      setBlocks((bs) => [...bs, nb]);
      setLinks((ls) => setSlot(ls, b.id, slot, nb.id));
      setSel([nb.id]);
    },
  });

  // ---- right-click menu: on a block (selecting it unless it is already part of the selection)
  // or on empty canvas. Text fields keep the browser's own menu.
  const onContextMenu = (e) => {
    if (e.target.closest('input, textarea, select')) return;
    const id = e.target.closest('[data-block-id]')?.getAttribute('data-block-id');
    if (!id && e.target !== canvasRef.current) return;
    e.preventDefault();
    if (id && !selRef.current.includes(id)) setSel([id]);
    const r = canvasRef.current.getBoundingClientRect();
    setMenu({ x: e.clientX - r.left, y: e.clientY - r.top, world: toWorld(e.clientX, e.clientY) });
  };

  const menuItems = () => {
    const n = sel.length;
    const many = n > 1 ? ` ${n} blocks` : '';
    return [
      { label: `Copy${many}`, hint: 'Ctrl+C', disabled: !n, onClick: copy },
      { label: `Cut${many}`, hint: 'Ctrl+X', disabled: !n, onClick: cut },
      { label: 'Paste here', hint: 'Ctrl+V', disabled: !hasClip(), onClick: () => pasteAt(menu.world) },
      { label: `Duplicate${many}`, hint: 'Ctrl+D', disabled: !n, onClick: () => duplicate(sel) },
      'sep',
      { label: 'Select all', hint: 'Ctrl+A', disabled: !blocks.length, onClick: selectAll },
      { label: `Delete${many}`, hint: 'Del', disabled: !n, danger: true, onClick: () => remove(sel) },
    ];
  };

  const arrows = buildArrows(blocks, links, sizes, steps.linkChanged);
  const draftArrow = buildDraftArrow(blocks, sizes, draft);
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
        onUndo={history.undo}
        onRedo={history.redo}
        canUndo={history.canUndo}
        canRedo={history.canRedo}
        onExport={exportJson}
        onExportImage={exportImage}
        onImport={importFile}
      />

      <div
        ref={canvasRef}
        onPointerDown={onCanvasDown}
        onContextMenu={onContextMenu}
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
                onDelete={() => remove([b.id])}
              >
                {(active) => <Body block={b} patch={(p) => updateBlock(b.id, p)} active={active}
                  prev={steps.prevBlock(b.id)} pointer={pointerApi(b)} />}
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

        {menu && <ContextMenu x={menu.x} y={menu.y} items={menuItems()} onClose={() => setMenu(null)} />}

        <StepBar
          steps={stepList}
          viewingId={viewing}
          dirty={steps.dirty}
          hasBackup={!!backup}
          showChanges={showChanges}
          onSave={steps.save}
          onLoad={steps.load}
          onUpdate={steps.update}
          onDelete={steps.remove}
          onLive={steps.backToLive}
          onPrev={() => steps.stepBy(-1)}
          onNext={() => steps.stepBy(1)}
          onToggleChanges={steps.toggleChanges}
          onRename={(id, label) => steps.patch(id, { label })}
          onNote={(id, note) => steps.patch(id, { note })}
        />
      </div>

      {tabBar}
      <StatusBar blockCount={blocks.length} linkCount={links.length} selCount={sel.length} />
    </div>
  );
}
