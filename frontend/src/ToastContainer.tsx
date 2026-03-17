import type { Toast } from "./types.ts";
import { I } from "./Icons.tsx";

interface Props {
  toasts: Toast[];
  remove: (id: number) => void;
}

export const ToastContainer = ({ toasts, remove }: Props) => (
  <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 10000, display: 'flex', flexDirection: 'column', gap: 10, pointerEvents: 'none' }}>
    {toasts.map(t => (
      <div key={t.id} style={{ 
        background: 'var(--popover-bg)', 
        backdropFilter: 'blur(16px) saturate(180%)',
        WebkitBackdropFilter: 'blur(16px) saturate(180%)',
        border: '1px solid var(--border)',
        borderLeft: `4px solid ${t.color || 'var(--accent)'}`, 
        borderRadius: 12, 
        padding: '14px 20px', 
        color: 'var(--text-main)', 
        fontSize: 14, 
        fontWeight: 500,
        boxShadow: '0 12px 40px var(--shadow)', 
        pointerEvents: 'auto', 
        display: 'flex', 
        alignItems: 'center', 
        gap: 14, 
        animation: 'toastSlideIn .4s cubic-bezier(0.19, 1, 0.22, 1)', 
        maxWidth: 400,
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ flex: 1, lineHeight: 1.5 }}>{t.msg}</div>
        <button onClick={() => remove(t.id)} style={{ background: 'var(--hover)', border: 'none', color: 'var(--text-subtle)', cursor: 'pointer', padding: 6, borderRadius: 8, display: 'flex', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = 'var(--text-main)'}><I.X s={12} /></button>
      </div>
    ))}
  </div>
);
