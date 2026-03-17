import type { Toast } from "./types.ts";
import { I } from "./Icons.tsx";

interface Props {
  toasts: Toast[];
  remove: (id: number) => void;
}

export const ToastContainer = ({ toasts, remove }: Props) => (
  <div style={{ position: 'fixed', bottom: 36, right: 16, zIndex: 9999, display: 'flex', flexDirection: 'column-reverse', gap: 6, pointerEvents: 'none' }}>
    {toasts.map(t => (
      <div key={t.id} style={{ background: '#252526', border: '1px solid #3c3c3c', borderLeft: `3px solid ${t.color || '#007acc'}`, borderRadius: 4, padding: '8px 14px', color: '#d4d4d4', fontSize: 14, boxShadow: '0 4px 16px rgba(0,0,0,.4)', pointerEvents: 'auto', display: 'flex', alignItems: 'center', gap: 8, animation: 'slideIn .2s ease', maxWidth: 320 }}>
        <span style={{ flex: 1 }}>{t.msg}</span>
        <button onClick={() => remove(t.id)} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', padding: 0 }}><I.X /></button>
      </div>
    ))}
  </div>
);
