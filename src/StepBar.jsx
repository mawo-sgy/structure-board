import { useState, useRef } from 'react';
import { T, COLORS } from './theme.js';
import { useAutoHeight } from './useAutoIndent.js';

const sbChip = { minWidth: 24, height: 24, padding: '0 6px', boxSizing: 'border-box', borderRadius: 5, border: `1px solid ${T.rule}`, background: '#fff', color: T.ink, font: `500 11.5px ${T.mono}`, cursor: 'pointer', flex: 'none', display: 'flex', alignItems: 'center', gap: 5 };
const sbAct = { height: 24, padding: '0 9px', borderRadius: 5, border: `1px solid ${T.rule}`, background: '#fff', color: T.ink, font: `500 11.5px ${T.sans}`, cursor: 'pointer', whiteSpace: 'nowrap', flex: 'none' };
const sbNav = { width: 22, height: 24, border: 'none', background: 'transparent', color: T.muted, fontSize: 16, cursor: 'pointer', padding: 0, flex: 'none' };
const sbPanel = { background: '#fff', border: `1px solid ${T.rule}`, borderRadius: 10, boxShadow: '0 4px 16px rgba(30,25,15,0.10)', boxSizing: 'border-box', maxWidth: '100%' };

// Older boards saved "Step N" as the label; treat that (or empty) as "no custom name".
const customLabel = (s) => (s.label && !/^Step \d+$/.test(s.label) ? s.label : '');

// Floating timeline of saved states ("steps") for tracing an algorithm — of the whole board
// (centered at the bottom of the canvas) or of one step zone (`placement` = { left, top } in
// canvas pixels, under the zone). Double-click a step to rename it; the note line describes the
// step being viewed.
export function StepBar({ steps, viewingId, dirty, hasBackup, showChanges, onSave, onLoad, onUpdate, onDelete, onLive, onPrev, onNext, onToggleChanges, onRename, onNote, title = 'Steps', placement = null }) {
  const [editing, setEditing] = useState(null);
  const [draftName, setDraftName] = useState('');
  const noteRef = useRef(null);
  const idx = steps.findIndex((s) => s.id === viewingId);
  const cur = idx >= 0 ? steps[idx] : null;
  const has = steps.length > 0;
  useAutoHeight(noteRef, cur?.id, cur?.note);

  const commitRename = () => {
    if (editing) onRename(editing, draftName.trim());
    setEditing(null);
  };

  return (
    <div data-nodrag data-noexport style={{
      position: 'absolute', zIndex: 8, display: 'flex', flexDirection: 'column', gap: 6,
      font: `12px ${T.sans}`, color: T.ink,
      ...(placement
        ? { left: placement.left, top: placement.top, alignItems: 'flex-start' }
        : { left: '50%', bottom: 14, transform: 'translateX(-50%)', alignItems: 'center', maxWidth: 'calc(100% - 28px)' }),
    }}>
      {cur && (
        <div style={{ ...sbPanel, width: 480, display: 'flex', alignItems: 'baseline', gap: 8, padding: '6px 12px' }}>
          <span style={{ color: T.muted, fontWeight: 500, whiteSpace: 'nowrap', flex: 'none' }}>
            Step {idx + 1}{customLabel(cur) ? ` · ${customLabel(cur)}` : ''}
          </span>
          <textarea
            ref={noteRef}
            rows={1}
            value={cur.note || ''}
            placeholder="What happened in this step?"
            spellCheck={false}
            onChange={(e) => onNote(cur.id, e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); e.currentTarget.blur(); } }}
            style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent', font: `13px/1.45 ${T.sans}`, color: T.ink, padding: 0, resize: 'none', overflow: 'hidden', display: 'block' }}
          />
        </div>
      )}

      <div style={{ ...sbPanel, display: 'flex', alignItems: 'center', gap: 6, padding: '5px 6px 5px 12px', whiteSpace: 'nowrap' }}>
        <span style={{ color: placement ? COLORS.blue.dot : T.muted, fontWeight: 500, flex: 'none' }}>{title}</span>
        {has && <button title="Previous step (←)" onClick={onPrev} style={sbNav}>‹</button>}
        <div style={{ display: 'flex', gap: 4, overflowX: 'auto', minWidth: 0 }}>
          {steps.map((s, i) => {
            const on = s.id === viewingId;
            const edited = on && dirty;
            const label = customLabel(s);
            if (editing === s.id) {
              return (
                <input key={s.id} autoFocus value={draftName} placeholder={`Step ${i + 1}`} spellCheck={false}
                  onChange={(e) => setDraftName(e.target.value)}
                  onBlur={commitRename}
                  onKeyDown={(e) => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') { e.stopPropagation(); setEditing(null); } }}
                  style={{ ...sbChip, width: `${Math.max(10, draftName.length + 2)}ch`, cursor: 'text', outline: 'none', borderColor: COLORS.blue.dot, fontFamily: T.sans }} />
              );
            }
            const title = `${label || `Step ${i + 1}`}${s.note ? ` — ${s.note}` : ''}${edited ? ' (edited)' : ''} · double-click to rename`;
            return (
              <button key={s.id} title={title} onClick={() => onLoad(s.id)}
                onDoubleClick={() => { setEditing(s.id); setDraftName(label); }}
                style={{
                  ...sbChip,
                  background: on && !edited ? T.ink : '#fff',
                  color: on && !edited ? '#fff' : T.ink,
                  borderColor: on ? T.ink : T.rule,
                  borderStyle: edited ? 'dashed' : 'solid',
                }}>
                {i + 1}
                {label && <span style={{ fontFamily: T.sans, fontWeight: 400, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>}
              </button>
            );
          })}
          {hasBackup && (
            <button onClick={onLive} title="Back to the board as it was before you opened a step"
              style={{ ...sbChip, borderStyle: 'dashed', color: T.muted, fontFamily: T.sans }}>Live</button>
          )}
        </div>
        {has && <button title="Next step (→)" onClick={onNext} style={sbNav}>›</button>}
        <span style={{ width: 1, height: 18, background: T.rule, margin: '0 2px', flex: 'none' }} />
        <button onClick={onSave} title={placement ? 'Save this zone as a new step (S)' : 'Save the board as a new step (S)'} style={sbAct}>
          {has ? '+ Save step' : '+ Save as step 1'}
        </button>
        {cur && dirty && <button onClick={onUpdate} title={placement ? 'Overwrite this step with the zone' : 'Overwrite this step with the board'} style={sbAct}>Update {idx + 1}</button>}
        {cur && <button onClick={onDelete} style={{ ...sbAct, color: COLORS.red.dot }}>Delete {idx + 1}</button>}
        {has && (
          <button onClick={onToggleChanges} title="Highlight values and arrows that changed since the previous step"
            style={{ ...sbAct, background: showChanges ? T.changed : '#fff', borderColor: showChanges ? COLORS.yellow.border : T.rule }}>
            Changes
          </button>
        )}
      </div>
    </div>
  );
}
