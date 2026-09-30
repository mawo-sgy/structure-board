# Structure Board

A pannable, zoomable scratchpad for sketching C data structures next to the code that uses them.

```bash
cd structure-board
npm install
npm run dev        # http://localhost:5173
npm run build      # static build in dist/ (Vercel/Netlify-ready)
npm test           # unit tests (Vitest)
```

## Layout

```
src/
  main.jsx            entry
  Workspace.jsx       tabs: one board per tab, saved together
  StepBar.jsx         step snapshots timeline + change highlighting
  TabBar.jsx          bottom sheet tabs (double-click rename, right-click menu)
  Board.jsx           one board: state, wiring, canvas rendering
  board/              board logic: pure modules (model, history, steps, arrows, files) + hooks + tests
  tabs.js             tab list helpers
  BlockFrame.jsx      positions a block + hover/selection affordances (no card chrome)
  LinkArrow.jsx       SVG link arrows + midpoint delete target
  Toolbar.jsx         top toolbar + status bar
  geometry.js         rectangle-edge intersection for arrows
  templates.js        starter boards (sorting, linked list, stack/queue in arrays, tree walk, malloc/free)
  storage.js          localStorage load/save + seed board
  useAutoIndent.js    Tab / Shift+Tab / Enter auto-indent (Code + Note)
  controls.jsx        small shared inputs/buttons
  theme.js            colors, fonts, shared styles
  blocks/             one module-scope component per block type + registry
```

## Features

- Blocks: arrays with index markers, 2D arrays, list and tree nodes with pointer arrows, stack, queue, struct, memory table, variables/pointers, table, notes, post-its, headings, code.
- Steps: save snapshots (S), replay with ← / →, rename a step (double-click), write a note per step, and see what changed (values and arrows) since the previous step.
- Editing: undo/redo, multi-select (Shift+click or Shift+drag), copy/paste between tabs, duplicate. Right-click a block or the canvas for Copy / Cut / Paste here / Duplicate / Delete.
- Tabs: one board per tab, drag to reorder, start from a template.
- Export a board as a PNG image or a JSON file (JSON includes steps); import JSON.

All tabs are saved to `localStorage` under `structure-board:v2` (an older single-board `structure-board:v1` save is migrated into the first tab). Clear both keys to get the starter example back.
