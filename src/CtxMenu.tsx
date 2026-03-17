import { useRef, useEffect } from "react";
import type { CtxMenuItem } from "./types.ts";
import { I } from "./Icons.tsx";

interface Props {
  x: number;
  y: number;
  items: CtxMenuItem[];
  onClose: () => void;
}

export const CtxMenu = ({ x, y, items, onClose }: Props) => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [onClose]);
  const adjX = Math.min(x, window.innerWidth - 200);
  const adjY = Math.min(y, window.innerHeight - items.length * 32 - 20);
  return (
    <div ref={ref} style={{ position: 'fixed', left: adjX, top: adjY, background: '#252526', border: '1px solid #3c3c3c', borderRadius: 4, padding: '4px 0', zIndex: 10000, boxShadow: '0 6px 24px rgba(0,0,0,.5)', minWidth: 180 }}>
      {items.map((it, i) => it.divider ? <div key={i} style={{ height: 1, background: '#3c3c3c', margin: '4px 0' }} /> : (
        <button key={i} onClick={() => { it.action?.(); onClose(); }} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '6px 14px', background: 'none', border: 'none', color: it.danger ? '#f44747' : '#ccc', fontSize: 14, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}
          onMouseEnter={e => (e.currentTarget.style.background = '#2d2d2d')}
          onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
          {it.icon && <span style={{ opacity: .6 }}>{it.icon}</span>}
          <span style={{ flex: 1 }}>{it.label}</span>
          {it.shortcut && <I.Kbd>{it.shortcut}</I.Kbd>}
        </button>
      ))}
    </div>
  );
};
