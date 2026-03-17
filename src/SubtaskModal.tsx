import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { I } from "./Icons.tsx";

interface Props {
  onAdd: (title: string) => void;
  onCancel: () => void;
}

export const SubtaskModal = ({ onAdd, onCancel }: Props) => {
  const [val, setVal] = useState("");
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    ref.current?.focus();
  }, []);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!val.trim()) return;
    onAdd(val.trim());
  };

  return createPortal(
    <div 
      className="portal-node"
      onClick={e => e.stopPropagation()}
      onMouseDown={e => e.stopPropagation()}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)', animation: 'fadeIn .2s' }}>
      <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 16, width: 400, padding: 24, boxShadow: '0 30px 90px rgba(0,0,0,0.4)', animation: 'scaleIn .2s ease-out' }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: 18, fontWeight: 700, color: 'var(--text-main)' }}>Add Subtask</h3>
        
        <form onSubmit={handleSubmit}>
          <input 
            ref={ref}
            value={val}
            onChange={e => setVal(e.target.value)}
            placeholder="What needs to be done?"
            style={{ width: '100%', background: 'var(--bg-alt)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 14px', fontSize: 14, color: 'var(--text-main)', outline: 'none', marginBottom: 24, transition: 'all .2s' }}
            onFocus={e => e.currentTarget.style.borderColor = 'var(--accent)'}
            onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'}
          />
          
          <div style={{ display: 'flex', gap: 12 }}>
            <button 
              type="button"
              onClick={onCancel}
              style={{ flex: 1, padding: '10px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-alt)', color: 'var(--text-main)', cursor: 'pointer', fontWeight: 600, fontSize: 14 }}
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={!val.trim()}
              style={{ flex: 1, padding: '10px', borderRadius: 10, border: 'none', background: 'var(--accent)', color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: 14, opacity: val.trim() ? 1 : 0.5 }}
            >
              Add Subtask
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
