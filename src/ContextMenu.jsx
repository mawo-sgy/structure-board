import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { T, COLORS } from './theme.js';

const menuItem = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 28, width: '100%',
  textAlign: 'left', font: `12px ${T.sans}`, color: T.ink, background: 'transparent', border: 'none',
  padding: '6px 12px', cursor: 'pointer', whiteSpace: 'nowrap', borderRadius: 4,
};

// Right-click menu, positioned at (x, y) inside its offset parent (the canvas) and kept on screen.
// items: [{ label, hint?, onClick, disabled?, danger? } | 'sep']. Closes on any outside pointer
// press, wheel, window blur, or after an item runs.
export function ContextMenu({ x, y, items, onClose }) {
  const ref = useRef(null);
  const [pos, setPos] = useState({ left: x, top: y });
  const [hover, setHover] = useState(-1);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useLayoutEffect(() => {
    const el = ref.current, parent = el?.offsetParent;
    if (!el || !parent) return;
    setPos({
      left: Math.max(4, Math.min(x, parent.clientWidth - el.offsetWidth - 4)),
      top: Math.max(4, Math.min(y, parent.clientHeight - el.offsetHeight - 4)),
    });
  }, [x, y]);

  useEffect(() => {
    const outside = (e) => { if (!ref.current?.contains(e.target)) closeRef.current(); };
    const close = () => closeRef.current();
    window.addEventListener('pointerdown', outside, true);
    window.addEventListener('wheel', close, true);
    window.addEventListener('blur', close);
    return () => {
      window.removeEventListener('pointerdown', outside, true);
      window.removeEventListener('wheel', close, true);
      window.removeEventListener('blur', close);
    };
  }, []);

  return (
    <div ref={ref} data-nodrag data-noexport role="menu" onContextMenu={(e) => e.preventDefault()}
      style={{
        position: 'absolute', left: pos.left, top: pos.top, zIndex: 30, minWidth: 190,
        background: '#fff', border: `1px solid ${T.rule}`, borderRadius: 7, padding: 4,
        boxShadow: '0 6px 20px rgba(30,25,15,0.14)',
      }}>
      {items.map((it, i) => {
        if (it === 'sep') return <div key={i} style={{ height: 1, background: T.rule, margin: '4px 2px' }} />;
        const color = it.disabled ? T.faint : it.danger ? COLORS.red.dot : T.ink;
        return (
          <button key={i} role="menuitem" disabled={it.disabled}
            onPointerEnter={() => setHover(i)} onPointerLeave={() => setHover(-1)}
            onClick={() => { it.onClick(); onClose(); }}
            style={{ ...menuItem, color, cursor: it.disabled ? 'default' : 'pointer', background: hover === i && !it.disabled ? T.bg : 'transparent' }}>
            <span>{it.label}</span>
            {it.hint && <span style={{ font: `11px ${T.mono}`, color: T.faint }}>{it.hint}</span>}
          </button>
        );
      })}
    </div>
  );
}
