import { useState, useEffect, useRef } from 'react';
import { T, COLORS } from './theme.js';

const tabMenuItem = { display: 'block', width: '100%', textAlign: 'left', font: `12px ${T.sans}`, color: T.ink, background: 'transparent', border: 'none', padding: '6px 12px', cursor: 'pointer', whiteSpace: 'nowrap' };

// Excel-style sheet tabs along the bottom of the board.
// Click to switch · double-click to rename · right-click for rename / duplicate / delete · drag to reorder.
export function TabBar({ tabs, activeId, templates = [], onSelect, onAdd, onRename, onDuplicate, onDelete, onMove }) {
  const [editing, setEditing] = useState(null);
  const [draftName, setDraftName] = useState('');
  const [menu, setMenu] = useState(null);
  const [addMenu, setAddMenu] = useState(false);
  const [dragTab, setDragTab] = useState(null);
  const [dropAt, setDropAt] = useState(null); // { id, after } insertion point while dragging a tab
  const menuRef = useRef(null);
  const addRef = useRef(null);

  useEffect(() => {
    if (!addMenu) return;
    const close = (e) => { if (!addRef.current?.contains(e.target)) setAddMenu(false); };
    window.addEventListener('pointerdown', close);
    return () => window.removeEventListener('pointerdown', close);
  }, [addMenu]);

  useEffect(() => {
    if (!menu) return;
    const close = (e) => { if (!menuRef.current?.contains(e.target)) setMenu(null); };
    window.addEventListener('pointerdown', close);
    return () => window.removeEventListener('pointerdown', close);
  }, [menu]);

  const startRename = (t) => { setMenu(null); setEditing(t.id); setDraftName(t.name); };
  const commitRename = () => {
    const name = draftName.trim();
    if (editing && name) onRename(editing, name);
    setEditing(null);
  };

  return (
    <div style={{ height: 32, flex: 'none', display: 'flex', alignItems: 'stretch', background: T.chrome, borderTop: `1px solid ${T.rule}`, font: `12.5px ${T.sans}`, position: 'relative', zIndex: 9 }}>
      <div ref={addRef} style={{ position: 'relative', flex: 'none', display: 'flex' }}>
        <button title="New board" onClick={() => setAddMenu((v) => !v)}
          style={{ width: 36, border: 'none', borderRight: `1px solid ${T.rule}`, background: addMenu ? T.bg : 'transparent', color: T.muted, fontSize: 17, cursor: 'pointer' }}>+</button>
        {addMenu && (
          <div style={{ position: 'absolute', left: 4, bottom: 'calc(100% + 6px)', background: '#fff', border: `1px solid ${T.rule}`, borderRadius: 7, boxShadow: '0 6px 20px rgba(30,25,15,0.14)', padding: '4px 0', minWidth: 200, zIndex: 20 }}>
            <button style={tabMenuItem} onClick={() => { onAdd(null); setAddMenu(false); }}>Empty board</button>
            <div style={{ height: 1, background: T.rule, margin: '4px 0' }} />
            <div style={{ font: `500 10px ${T.sans}`, letterSpacing: '.06em', textTransform: 'uppercase', color: T.muted, padding: '4px 12px 2px' }}>From a template</div>
            {templates.map((t) => (
              <button key={t.key} style={tabMenuItem} onClick={() => { onAdd(t.key); setAddMenu(false); }}>{t.name}</button>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'stretch', overflowX: 'auto', minWidth: 0 }}>
        {tabs.map((t) => {
          const active = t.id === activeId;
          const drop = dropAt?.id === t.id && dragTab !== t.id ? (dropAt.after ? 'inset -2px 0 0' : 'inset 2px 0 0') : null;
          const shadows = [active && `inset 0 -2px 0 ${COLORS.blue.dot}`, drop && `${drop} ${COLORS.blue.dot}`].filter(Boolean);
          return (
            <div key={t.id}
              draggable={editing !== t.id}
              onDragStart={(e) => { setDragTab(t.id); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', t.name); }}
              onDragOver={(e) => {
                if (!dragTab) return;
                e.preventDefault();
                const r = e.currentTarget.getBoundingClientRect();
                const after = e.clientX > r.left + r.width / 2;
                if (dropAt?.id !== t.id || dropAt.after !== after) setDropAt({ id: t.id, after });
              }}
              onDrop={(e) => {
                e.preventDefault();
                if (dragTab && dropAt && dragTab !== dropAt.id) onMove(dragTab, dropAt.id, dropAt.after);
                setDragTab(null); setDropAt(null);
              }}
              onDragEnd={() => { setDragTab(null); setDropAt(null); }}
              onClick={() => !active && onSelect(t.id)}
              onDoubleClick={() => startRename(t)}
              onContextMenu={(e) => { e.preventDefault(); const r = e.currentTarget.getBoundingClientRect(); setMenu({ id: t.id, left: r.left }); }}
              style={{
                display: 'flex', alignItems: 'center', padding: '0 16px', marginTop: -1, cursor: active ? 'default' : 'pointer',
                whiteSpace: 'nowrap', userSelect: 'none', flex: 'none',
                background: active ? T.bg : 'transparent',
                color: active ? T.ink : T.muted, fontWeight: active ? 600 : 400,
                borderRight: `1px solid ${T.rule}`,
                boxShadow: shadows.length ? shadows.join(', ') : 'none',
                opacity: dragTab === t.id ? 0.5 : 1,
              }}>
              {editing === t.id ? (
                <input autoFocus value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                  onBlur={commitRename}
                  onKeyDown={(e) => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') { e.stopPropagation(); setEditing(null); } }}
                  style={{ font: 'inherit', color: T.ink, width: `${Math.max(6, draftName.length + 1)}ch`, border: `1px solid ${COLORS.blue.dot}`, borderRadius: 3, padding: '1px 4px', outline: 'none', background: '#fff' }} />
              ) : t.name}
            </div>
          );
        })}
      </div>

      {menu && (
        <div ref={menuRef} style={{ position: 'fixed', left: menu.left, bottom: 62, background: '#fff', border: `1px solid ${T.rule}`, borderRadius: 7, boxShadow: '0 6px 20px rgba(30,25,15,0.14)', padding: '4px 0', minWidth: 140, zIndex: 20 }}>
          <button style={tabMenuItem} onClick={() => startRename(tabs.find((t) => t.id === menu.id))}>Rename</button>
          <button style={tabMenuItem} onClick={() => { onDuplicate(menu.id); setMenu(null); }}>Duplicate</button>
          <button style={{ ...tabMenuItem, color: tabs.length > 1 ? COLORS.red.dot : T.faint, cursor: tabs.length > 1 ? 'pointer' : 'default' }}
            disabled={tabs.length <= 1}
            onClick={() => { onDelete(menu.id); setMenu(null); }}>Delete</button>
        </div>
      )}
    </div>
  );
}
