import { useState, useEffect, useCallback } from 'react';
import { uid } from './theme.js';
import { loadWorkspace, saveWorkspace, emptyBoard } from './storage.js';
import Board from './Board.jsx';
import { TabBar } from './TabBar.jsx';
import { TEMPLATES } from './templates.js';
import { moveTab, nextBoardName, uniqueName } from './tabs.js';

// Owns the set of boards (tabs). Each tab remounts <Board> with its own state.
export default function Workspace() {
  const [ws, setWs] = useState(() => loadWorkspace());

  useEffect(() => {
    const t = setTimeout(() => saveWorkspace(ws), 600);
    return () => clearTimeout(t);
  }, [ws]);

  const activeId = ws.activeId;
  const onBoardChange = useCallback((state) => {
    setWs((w) => ({ ...w, boards: { ...w.boards, [activeId]: state } }));
  }, [activeId]);

  const addTab = (templateKey) => setWs((w) => {
    const id = uid();
    const tpl = TEMPLATES.find((t) => t.key === templateKey);
    const name = tpl ? uniqueName(w.tabs, tpl.name) : nextBoardName(w.tabs);
    return { tabs: [...w.tabs, { id, name }], activeId: id, boards: { ...w.boards, [id]: tpl ? tpl.build() : emptyBoard() } };
  });

  const reorderTab = (id, targetId, after) => setWs((w) => ({ ...w, tabs: moveTab(w.tabs, id, targetId, after) }));

  const renameTab = (id, name) => setWs((w) => ({ ...w, tabs: w.tabs.map((t) => (t.id === id ? { ...t, name } : t)) }));

  const duplicateTab = (id) => setWs((w) => {
    const src = w.tabs.find((t) => t.id === id);
    const nid = uid();
    const i = w.tabs.indexOf(src);
    const tabs = [...w.tabs.slice(0, i + 1), { id: nid, name: `${src.name} copy` }, ...w.tabs.slice(i + 1)];
    return { tabs, activeId: nid, boards: { ...w.boards, [nid]: JSON.parse(JSON.stringify(w.boards[id] || emptyBoard())) } };
  });

  const deleteTab = (id) => {
    const tab = ws.tabs.find((t) => t.id === id);
    if (ws.tabs.length <= 1 || !tab) return;
    const count = ws.boards[id]?.blocks?.length || 0;
    if (count && !window.confirm(`Delete "${tab.name}" and its ${count} block${count === 1 ? '' : 's'}?`)) return;
    setWs((w) => {
      const i = w.tabs.findIndex((t) => t.id === id);
      const tabs = w.tabs.filter((t) => t.id !== id);
      const boards = { ...w.boards };
      delete boards[id];
      const activeId = w.activeId === id ? tabs[Math.max(0, i - 1)].id : w.activeId;
      return { tabs, activeId, boards };
    });
  };

  return (
    <Board
      key={activeId}
      initial={ws.boards[activeId] || emptyBoard()}
      name={ws.tabs.find((t) => t.id === activeId)?.name}
      onChange={onBoardChange}
      tabBar={
        <TabBar
          tabs={ws.tabs}
          activeId={activeId}
          templates={TEMPLATES}
          onSelect={(id) => setWs((w) => ({ ...w, activeId: id }))}
          onAdd={addTab}
          onRename={renameTab}
          onDuplicate={duplicateTab}
          onDelete={deleteTab}
          onMove={reorderTab}
        />
      }
    />
  );
}
