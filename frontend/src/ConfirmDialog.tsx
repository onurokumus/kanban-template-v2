import { createPortal } from "react-dom";
import { I } from "./Icons.tsx";

interface Props {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  confirmColor?: string;
}

export const ConfirmDialog = ({ title, message, onConfirm, onCancel, confirmText = "Confirm", confirmColor = "var(--prio-critical)" }: Props) => {
  return createPortal(
    <div 
      className="portal-node"
      onClick={e => e.stopPropagation()}
      onMouseDown={e => e.stopPropagation()}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)', animation: 'fadeIn .2s' }}>
      <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 16, width: 360, padding: 24, boxShadow: '0 30px 90px rgba(0,0,0,0.4)', animation: 'scaleIn .2s ease-out', fontFamily: 'inherit' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{ background: 'color-mix(in srgb, ' + confirmColor + ', transparent 90%)', color: confirmColor, padding: 10, borderRadius: 12, display: 'flex' }}>
            <I.Trash s={20} />
          </div>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--text-main)', fontFamily: 'inherit' }}>{title}</h3>
        </div>
        
        <p style={{ margin: '0 0 24px 0', fontSize: 14, color: 'var(--text-dim)', lineHeight: 1.5, fontFamily: 'inherit' }}>
          {message}
        </p>
        
        <div style={{ display: 'flex', gap: 12 }}>
          <button 
            onClick={onCancel}
            style={{ flex: 1, padding: '10px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-alt)', color: 'var(--text-main)', cursor: 'pointer', fontWeight: 600, fontSize: 14, transition: 'all .2s' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--text-subtle)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm}
            style={{ flex: 1, padding: '10px', borderRadius: 10, border: 'none', background: confirmColor, color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: 14, transition: 'all .2s', boxShadow: '0 4px 12px color-mix(in srgb, ' + confirmColor + ', transparent 50%)' }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
