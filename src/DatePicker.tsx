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
  const [mode, setMode] = useState<'days' | 'months' | 'years'>('days');
  
  const current = useMemo(() => parse(value) || new Date(), [value]);
  const [view, setView] = useState(new Date(current.getFullYear(), current.getMonth(), 1));

  useEffect(() => {
    if (open) {
      setView(new Date(current.getFullYear(), current.getMonth(), 1));
      setMode('days');
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

  const changeMonth = (n: number) => setView(new Date(view.getFullYear(), view.getMonth() + n, 1));
  const changeYear = (n: number) => setView(new Date(view.getFullYear() + n, view.getMonth(), 1));
  const changeYearRange = (n: number) => setView(new Date(view.getFullYear() + n * 12, view.getMonth(), 1));

  const handleDaySelect = (d: Date) => { onChange(fmt(d)); setOpen(false); };
  const handleMonthSelect = (m: number) => { setView(new Date(view.getFullYear(), m, 1)); setMode('days'); };
  const handleYearSelect = (y: number) => { setView(new Date(y, view.getMonth(), 1)); setMode('months'); };

  const renderDays = () => (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, textAlign: 'center', marginBottom: 4 }}>
        {['M','T','W','T','F','S','S'].map((day, i) => (
          <span key={i} style={{ fontSize: 10, color: 'var(--text-subtle)', fontWeight: 700, fontFamily: 'inherit' }}>{day}</span>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
        {days.map((d, i) => {
          const isToday = d.toDateString() === new Date().toDateString();
          const isSel = d.toDateString() === current.toDateString();
          const isMainMonth = d.getMonth() === view.getMonth();
          return (
            <div key={i} onClick={() => handleDaySelect(d)}
              style={{ 
                height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, borderRadius: 4, cursor: 'pointer',
                background: isSel ? 'var(--accent)' : 'transparent', color: isSel ? '#fff' : (isMainMonth ? 'var(--text-main)' : 'var(--text-subtle)'),
                border: isToday && !isSel ? '1px solid var(--accent)' : 'none', transition: 'all .15s', fontFamily: 'inherit'
              }}
              onMouseEnter={e => !isSel && (e.currentTarget.style.background = 'var(--hover)')}
              onMouseLeave={e => !isSel && (e.currentTarget.style.background = 'transparent')}
            >{d.getDate()}</div>
          );
        })}
      </div>
    </>
  );

  const renderMonths = () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, padding: '4px 0' }}>
      {Array.from({ length: 12 }).map((_, m) => {
        const isSel = current.getMonth() === m && current.getFullYear() === view.getFullYear();
        const name = new Date(2000, m, 1).toLocaleDateString('en', { month: 'short' });
        return (
          <div key={m} onClick={() => handleMonthSelect(m)}
            style={{ padding: '10px 0', textAlign: 'center', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer', background: isSel ? 'var(--accent)' : 'transparent', color: isSel ? '#fff' : 'var(--text-main)', transition: 'all .1s', fontFamily: 'inherit' }}
            onMouseEnter={e => !isSel && (e.currentTarget.style.background = 'var(--hover)')}
            onMouseLeave={e => !isSel && (e.currentTarget.style.background = 'transparent')}
          >{name}</div>
        );
      })}
    </div>
  );

  const renderYears = () => {
    const startY = view.getFullYear() - 5;
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, padding: '4px 0' }}>
        {Array.from({ length: 12 }).map((_, i) => {
          const y = startY + i;
          const isSel = current.getFullYear() === y;
          return (
            <div key={y} onClick={() => handleYearSelect(y)}
              style={{ flex: 1, padding: '8px 0', background: isSel ? 'var(--accent)' : 'transparent', border: `1px solid ${isSel ? 'var(--accent)' : 'var(--border-subtle)'}`, borderRadius: 6, color: isSel ? '#fff' : 'var(--text-main)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', fontWeight: isSel ? 700 : 400 }}
              onMouseEnter={e => !isSel && (e.currentTarget.style.background = 'var(--hover)')}
              onMouseLeave={e => !isSel && (e.currentTarget.style.background = 'transparent')}
            >{y}</div>
          );
        })}
      </div>
    );
  };

  const Popover = (
    <div ref={popoverRef}
      className="portal-node"
      onClick={e => e.stopPropagation()}
      onMouseDown={e => e.stopPropagation()}
      style={{ 
        position: 'absolute', top: coords.top + 4, left: coords.left, 
        background: 'var(--popover-bg)', border: '1px solid var(--border)', borderRadius: 12, 
        boxShadow: '0 12px 48px var(--shadow)', zIndex: 9999, padding: 16,
        width: 260, userSelect: 'none', animation: 'slideIn .2s ease', backdropFilter: 'blur(20px)', fontFamily: 'inherit'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <button onClick={() => mode === 'days' ? changeMonth(-1) : mode === 'months' ? changeYear(-1) : changeYearRange(-1)} 
          style={{ background: 'none', border: 'none', color: 'var(--text-subtle)', cursor: 'pointer', transform: 'rotate(180deg)', padding: 6, borderRadius: 6, fontFamily: 'inherit' }} 
          onMouseEnter={e => e.currentTarget.style.background = 'var(--hover)'} onMouseLeave={e => e.currentTarget.style.background = 'none'}>
          <I.Chev open={false} s={16} />
        </button>
        
        <div 
          onClick={() => setMode(mode === 'days' ? 'months' : 'years')}
          style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-main)', cursor: 'pointer', padding: '4px 8px', borderRadius: 4, transition: 'background .2s', fontFamily: 'inherit' }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--hover)'}
          onMouseLeave={e => e.currentTarget.style.background = 'none'}
        >
          {mode === 'days' ? view.toLocaleDateString('en', { month: 'long', year: 'numeric' }) : 
           mode === 'months' ? view.getFullYear() : 
           `${view.getFullYear()-5} - ${view.getFullYear()+6}`}
        </div>

        <button onClick={() => mode === 'days' ? changeMonth(1) : mode === 'months' ? changeYear(1) : changeYearRange(1)} 
          style={{ background: 'none', border: 'none', color: 'var(--text-subtle)', cursor: 'pointer', padding: 6, borderRadius: 6, fontFamily: 'inherit' }} 
          onMouseEnter={e => e.currentTarget.style.background = 'var(--hover)'} onMouseLeave={e => e.currentTarget.style.background = 'none'}>
          <I.Chev open={false} s={16} />
        </button>
      </div>

      {mode === 'days' ? renderDays() : mode === 'months' ? renderMonths() : renderYears()}
      
      <div style={{ marginTop: 16, borderTop: '1px solid var(--border-subtle)', paddingTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button onClick={() => { setView(new Date()); setMode('days'); }} style={{ background: 'none', border: 'none', color: 'var(--text-subtle)', fontSize: 11, cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit' }}>Reset View</button>
        <button onClick={() => handleDaySelect(new Date())} style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: 12, cursor: 'pointer', padding: '4px 8px', fontWeight: 700, fontFamily: 'inherit' }}>Today</button>
      </div>
    </div>
  );

  return (
    <div ref={containerRef} style={{ position: 'relative', flex: 1, ...style }} className="date-picker">
      <div 
        onClick={() => setOpen(!open)}
        style={{ 
          display: 'flex', alignItems: 'center', gap: 6, 
          background: 'var(--hover)', border: '1px solid var(--border)', borderRadius: 4, 
          padding: '0 8px', cursor: 'pointer', transition: 'all .2s',
          height: style?.height || 32, boxSizing: 'border-box', fontFamily: 'inherit'
        }}
        className="date-input-wrap"
      >
        <span style={{ color: 'var(--text-subtle)', flexShrink: 0, display: 'flex' }}><I.Cal s={12} /></span>
        <span style={{ color: value ? 'var(--text-main)' : 'var(--text-subtle)', fontSize: 12, flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', fontFamily: 'inherit' }}>
          {value || 'Select..'}
        </span>
      </div>
      {open && createPortal(Popover, document.body)}
    </div>
  );
};
