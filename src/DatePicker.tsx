import { useState, useMemo, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { fmt, parse, addD } from "./constants.ts";
import { I } from "./Icons.tsx";

interface Props {
  value: string;
  onChange: (val: string) => void;
  style?: React.CSSProperties;
}

export const DatePicker = ({ value, onChange, style }: Props) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
  
  const current = useMemo(() => parse(value) || new Date(), [value]);
  const [view, setView] = useState(new Date(current.getFullYear(), current.getMonth(), 1));

  useEffect(() => {
    if (open) {
      setView(new Date(current.getFullYear(), current.getMonth(), 1));
      updateCoords();
    }
  }, [open, current]);

  const updateCoords = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width
      });
    }
  };

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => { 
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node) && 
          containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false); 
      }
    };
    window.addEventListener('scroll', updateCoords, true);
    window.addEventListener('resize', updateCoords);
    document.addEventListener('mousedown', h);
    return () => {
      window.removeEventListener('scroll', updateCoords, true);
      window.removeEventListener('resize', updateCoords);
      document.removeEventListener('mousedown', h);
    };
  }, [open]);

  const days = useMemo(() => {
    const d: Date[] = [];
    const start = new Date(view.getFullYear(), view.getMonth(), 1);
    const firstDay = start.getDay(); 
    const startOffset = firstDay === 0 ? 6 : firstDay - 1; 
    
    let curr = addD(start, -startOffset);
    for (let i = 0; i < 42; i++) {
      d.push(curr);
      curr = addD(curr, 1);
    }
    return d;
  }, [view]);

  const changeMonth = (n: number) => {
    setView(new Date(view.getFullYear(), view.getMonth() + n, 1));
  };

  const handleSelect = (d: Date) => {
    onChange(fmt(d));
    setOpen(false);
  };

  const Popover = (
    <div 
      ref={popoverRef}
      style={{ 
        position: 'absolute', 
        top: coords.top + 4, 
        left: coords.left, 
        background: '#1e1e1e', border: '1px solid #3c3c3c', borderRadius: 8, 
        boxShadow: '0 10px 30px rgba(0,0,0,.5)', zIndex: 9999, padding: 12,
        width: 260, userSelect: 'none', animation: 'slideIn .2s ease'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <button onClick={() => changeMonth(-1)} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', transform: 'rotate(180deg)', padding: 4 }}><I.Chev open={false} s={16} /></button>
        <span style={{ fontSize: 14, fontWeight: 600, color: '#d4d4d4' }}>
          {view.toLocaleDateString('en', { month: 'long', year: 'numeric' })}
        </span>
        <button onClick={() => changeMonth(1)} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', padding: 4 }}><I.Chev open={false} s={16} /></button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, textAlign: 'center', marginBottom: 4 }}>
        {['M','T','W','T','F','S','S'].map((day, i) => (
          <span key={i} style={{ fontSize: 10, color: '#555', fontWeight: 700 }}>{day}</span>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
        {days.map((d, i) => {
          const isToday = d.toDateString() === new Date().toDateString();
          const isSel = d.toDateString() === current.toDateString();
          const isMainMonth = d.getMonth() === view.getMonth();
          
          return (
            <div 
              key={i} 
              onClick={() => handleSelect(d)}
              style={{ 
                height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, borderRadius: 4, cursor: 'pointer',
                background: isSel ? '#007acc' : 'transparent',
                color: isSel ? '#fff' : (isMainMonth ? '#ccc' : '#444'),
                border: isToday && !isSel ? '1px solid #007acc' : 'none',
                transition: 'all .15s'
              }}
              onMouseEnter={e => !isSel && (e.currentTarget.style.background = '#2d2d2d')}
              onMouseLeave={e => !isSel && (e.currentTarget.style.background = 'transparent')}
            >
              {d.getDate()}
            </div>
          );
        })}
      </div>
      
      <div style={{ marginTop: 12, borderTop: '1px solid #2d2d2d', paddingTop: 8, display: 'flex', justifyContent: 'flex-end' }}>
        <button 
          onClick={() => handleSelect(new Date())} 
          style={{ background: 'none', border: 'none', color: '#007acc', fontSize: 12, cursor: 'pointer', padding: '4px 8px', fontWeight: 600 }}
        >
          Today
        </button>
      </div>
    </div>
  );

  return (
    <div ref={containerRef} style={{ position: 'relative', flex: 1, ...style }} className="date-picker">
      <div 
        onClick={() => setOpen(!open)}
        style={{ 
          display: 'flex', alignItems: 'center', gap: 8, 
          background: '#2d2d2d', border: '1px solid #3c3c3c', borderRadius: 4, 
          padding: '6px 10px', cursor: 'pointer', transition: 'all .2s',
          height: 32, boxSizing: 'border-box'
        }}
        className="date-input-wrap"
      >
        <span style={{ color: '#666', flexShrink: 0 }}><I.Cal /></span>
        <span style={{ color: value ? '#ccc' : '#555', fontSize: 13, flex: 1, whiteSpace: 'nowrap' }}>
          {value || 'Select date...'}
        </span>
      </div>
      {open && createPortal(Popover, document.body)}
    </div>
  );
};
