# CLAUDE.md — Structure Board

A pannable/zoomable canvas for sketching C data structures next to the code that uses them. Single user (a CS student), no backend, everything in `localStorage`.

## Run

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # static site in dist/ (Vercel/Netlify)
npm test         # Vitest unit tests (pure logic in src/board, tabs, geometry)
```

Stack: React 18 + Vite, plain JS (no TypeScript), no component library, **inline styles only** (plus a few pseudo-element rules in `index.html`). One runtime dependency besides React: `html-to-image` (PNG export).

## Architecture

```
src/
  main.jsx            mounts <Workspace/>
  Workspace.jsx       tabs: { tabs, activeId, boards{id: boardState} }; debounced save (600ms)
  Board.jsx           one board: owns blocks/links/selection, wires the hooks below, renders the canvas
  board/              board logic, split by concern
    model.js          pure ops on blocks/links: slots, remove, copy groups, move, bbox, paste offset
    history.js        pure undo/redo stack (compares states by reference)
    steps.js          pure step helpers: dirty check, reference step, change detection, ←/→ target
    arrows.js         arrow geometry from blocks + links + measured sizes
    files.js          JSON serialize/parse, downloads, PNG capture (html-to-image)
    clipboard.js      block clipboard (localStorage, works across tabs)
    dom.js            isTyping / blurActive
    useHistory.js     undo/redo hook: commits after a 400ms pause, or on drag end
    useSteps.js       step timeline state + actions + Changes highlight
    useMeasure.js     measures block sizes and [data-slot] anchors (ResizeObserver)
    useViewport.js    pan/zoom state, wheel handling, toWorld, fitTo
    useDrag.js        pointer gestures: pan, move selection, resize, link, box-select
    useBoardKeys.js   keyboard shortcuts
    *.test.js         Vitest tests for the pure modules
  tabs.js             pure tab helpers (moveTab, nextBoardName, uniqueName)
  BlockFrame.jsx      positions a block; hover/selection affordances (toolbar, grip, resize, link dot)
  LinkArrow.jsx       SVG arrows + midpoint × delete target
  ContextMenu.jsx     right-click menu (copy / cut / paste here / duplicate / select all / delete)
  StepBar.jsx         step (snapshot) timeline UI; step rename (double-click) + per-step note
  TabBar.jsx          bottom sheet tabs (drag to reorder) + "new board / template" menu
  Toolbar.jsx         top toolbar (add-block selects, undo/redo, export menu) + status bar
  templates.js        starter boards (build() returns a fresh board state; walkthrough() adds recorded steps)
  storage.js          localStorage load/save, v1→v2 migration, seed board
  geometry.js         edgePoint(): ray/rectangle-edge intersection for arrows
  useAutoIndent.js    Tab/Shift+Tab/Enter auto-indent (Code + Note) + useAutoHeight
  controls.jsx        shared small UI: AutoInput, Btn, Controls, AddN, DelX, Label, EmptyBox, PointerCell
  theme.js            T (colors/fonts), COLORS (blue/green/red/yellow), cellStyle, uid
  blocks/
    index.js          BLOCK_DEFS registry { label, Body, w?, color?, create() }, MENUS, createBlock()
    *Block.jsx        one body component per block type
```

### Data model

```js
// board state (one per tab)
{ blocks, links, view: {x, y, s}, steps, viewing, backup, showChanges }

// block (type-specific fields are flat on the block)
{ id, type, x, y, w?, color: null|'blue'|'green'|'red'|'yellow', ...fields }

// link
{ id, from, to }                          // plain block→block arrow (edge to edge)
{ id, from, to, next: true, slot }        // pointer arrow from a named slot inside `from`

// step
{ id, label, note, blocks, links }        // deep copies; view is not stored
                                          // label '' (or legacy "Step N") = unnamed, shown by index
```

Block types and their fields:
- `array` — elemType, name, cells[], markers[{id,name,index,color}]
- `matrix` — elemType, name, rows[][] (2D array)
- `list` — value (one node; pointer slot `next`)
- `tree` — value (one binary-tree node; pointer slots `left`, `right`)
- `stack` / `queue` — name, items[]
- `struct` — name, instance, fields[{id,type,name,value}] (field type ending `*` → pointer slot `f:<id>`)
- `memory` — rows[{addr,name,type,value}]
- `table` — cols[], rows[][]
- `variables` / `pointer` — varType, name, value (type ending `*` → pointer slot `ptr`)
- `note`, `postit`, `heading` — text
- `code` — title, text

Storage keys: `structure-board:v2` (workspace). `structure-board:v1` (old single board) is migrated into the first tab. `structure-board:clipboard` holds copied blocks (so paste works across tabs).

### Props every block body receives

`{ block, patch, active, prev, pointer }`
- `patch(partial)` merges into the block.
- `active` = hovered or selected (show controls only then).
- `prev` = the same block in the reference step (or null) → tint changed values with `T.changed`.
- `pointer` = `{ isLinked(slot), changed(slot), start(slot), clear(slot), spawn(slot, dx, dy) }` → used by `<PointerCell slot="…">`. `changed` = the slot points somewhere else than in the reference step. `spawn` creates a block of the same type at an offset and points `slot` at it (list "+ next node", tree "+ left/right").

### Where logic goes

Pure functions (no React, no DOM) go in `src/board/*.js` and get a test next to them. Hooks in `src/board/use*.js` hold state and call the pure functions. `Board.jsx` should stay wiring + rendering. Hooks that attach window listeners once read the latest values through a ref (`live.current = ctx`), never through stale closures.

### Selection, undo, clipboard

- Selection is an array of ids (`sel`). Click selects, Shift+click toggles, Shift+drag on empty canvas box-selects, Ctrl+A selects all. Dragging a selected block moves the whole selection. `BlockFrame` gets `selected` (outline) and `solo` (toolbar + link dot only when exactly one is selected).
- Undo covers `{ blocks, links }` only (not view, steps or step notes). Edits are committed to history after a 400ms pause; drags/resizes are committed on pointer-up. History is per board and is lost when switching tabs (the board remounts).
- Copy/cut/paste/duplicate copy the selected blocks plus the links between them, with fresh ids. Right-click (on a block or empty canvas) opens `ContextMenu` with the same actions; "Paste here" puts the group's top-left corner at the click point. Right-clicking a block outside the selection selects it; text fields keep the browser's menu.
- `remove` and `insert` call `history.commit()` first, so each one is its own undo step.
- Anything with `data-noexport` is hidden from the PNG export. SVG parts can't be hidden that way (html-to-image skips computed styles for SVG), so `LinkArrow` gets no `onDelete` while exporting.

### How arrows are measured

`useMeasure` measures each block's rendered size in a `useLayoutEffect` (plus a ResizeObserver) and every `[data-slot]` element's center (`sizes[id].anchors[slot]`). Plain links snap to block edges via `edgePoint`; slot links start at the slot center.

## Rules — do not break

1. **Block body components must be defined at module scope**, never inside `Board` or any render function. Inline components get a new identity every render → React remounts them → inputs lose focus after one keystroke.
2. **Inline styles only.** Keep the visual language: blocks are bare structures on the dot grid, no cards. Only `code` has a card (VS Code Dark+: `#1e1e1e`, header `#252526`, border `#3c3c3c`, text `#d4d4d4`, accent `#569cd6`). Post-it's color is its paper; all other colors are a wash behind the block.
3. **Exactly 4 highlight colors** (blue, green, red, yellow), from `COLORS` in `theme.js`.
4. **No `window.prompt()`** — use inline controlled inputs.
5. Controls under a block go in `<Controls>` (absolutely positioned) so they never change the measured block size.
6. Elements inside a block that should not start a block drag need `data-nodrag` (inputs/buttons/selects are already excluded).
7. `BlockFrame`'s ref callback (`registerRef` from `useMeasure`) must stay stable (`useCallback`) or the ResizeObserver loops.
8. Run `npm test` and `npm run build` before committing.

## Adding a block type

1. Create `src/blocks/FooBlock.jsx` exporting `default function FooBody({ block, patch, active, prev, pointer })`.
2. Register it in `BLOCK_DEFS` (`blocks/index.js`) with `create()` defaults, and add its key to a `MENUS` group.
3. If it holds pointers, render `<PointerCell pointer={pointer} slot="…" />`.

## Keyboard

Esc deselect · Delete/Backspace delete selection · Ctrl+Z undo · Ctrl+Shift+Z / Ctrl+Y redo · Ctrl+C / X / V copy, cut, paste · Ctrl+D duplicate · Ctrl+A select all · F fit all · S save step · ←/→ browse steps · Ctrl/⌘+scroll zoom · plain scroll pans · Shift+drag box-select · right-click for the copy/paste menu. Code/Note: Tab, Shift+Tab, Enter auto-indent.

## Known gaps / next ideas

- Tree nodes have no auto-layout: "+ left/right" places children at a fixed offset, so deep trees can overlap.
- Changes highlight for struct fields, stack/queue items and table cells compares by position, not id.
- `Structure Board Preview.html` (outside this folder) was a single-file preview built by concatenating `src/` — not needed here.
