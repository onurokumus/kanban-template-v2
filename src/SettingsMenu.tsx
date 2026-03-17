import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { I } from "./Icons.tsx";

interface Props {
  theme: 'dark' | 'light';
  setTheme: (t: 'dark' | 'light') => void;
  showArrows: boolean;
  setShowArrows: (v: boolean) => void;
  onExportPDF: () => void;
  onExportCSV: () => void;
  onExportMD: () => void;
}

const FONT = "'Cascadia Code','Fira Code','Segoe UI',monospace";

export const SettingsMenu = ({ theme, setTheme, showArrows, setShowArrows, onExportPDF, onExportCSV, onExportMD }: Props) => {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ top: 0, right: 0 });

  const updateCoords = () => {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + window.scrollY + 8,
        right: Math.max(20, window.innerWidth - rect.right - window.scrollX)
      });
    }
  };

  useEffect(() => {
    if (open) {
      updateCoords();
      const h = (e: MouseEvent) => {
        if (popRef.current && !popRef.current.contains(e.target as Node) && btnRef.current && !btnRef.current.contains(e.target as Node)) setOpen(false);
      };
      window.addEventListener('resize', updateCoords);
      document.addEventListener('mousedown', h);
      return () => {
        window.removeEventListener('resize', updateCoords);
        document.removeEventListener('mousedown', h);
      };
    }
  }, [open]);

  const Item = ({ icon, label, action, active, danger }: { icon: any, label: string, action: () => void, active?: boolean, danger?: boolean }) => (
    <div 
      onClick={() => { action(); }}
      style={{ 
        display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, cursor: 'pointer',
        background: active ? 'color-mix(in srgb, var(--accent), transparent 90%)' : 'transparent',
        color: danger ? '#f44747' : active ? 'var(--accent)' : 'var(--text-main)',
        fontSize: 13, fontWeight: active ? 700 : 500, transition: 'all .15s',
        fontFamily: FONT
      }}
      onMouseEnter={e => !active && (e.currentTarget.style.background = 'var(--hover)')}
      onMouseLeave={e => !active && (e.currentTarget.style.background = 'transparent')}
    >
      <span style={{ display: 'flex', opacity: active ? 1 : 0.7, width: 16, justifyContent: 'center' }}>{icon}</span>
      <span style={{ flex: 1 }}>{label}</span>
      {active && <I.Check s={12} />}
    </div>
  );

  const Section = ({ title, children }: { title: string, children: any }) => (
    <div style={{ padding: '6px 0' }}>
      <div style={{ padding: '4px 12px', fontSize: 10, fontWeight: 800, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '.12em', fontFamily: FONT, marginBottom: 4 }}>{title}</div>
      {children}
    </div>
  );

  const Popover = (
    <div 
      ref={popRef}
      style={{ 
        position: 'absolute', top: coords.top, right: coords.right,
        width: 220, background: 'var(--popover-bg)', border: '1px solid var(--border)', borderRadius: 12,
        boxShadow: '0 20px 60px var(--shadow)', zIndex: 10000, padding: 8,
        backdropFilter: 'blur(20px) saturate(180%)', userSelect: 'none', animation: 'slideIn .15s ease-out',
        fontFamily: FONT
      }}
    >
      <Section title="Appearance">
        <Item icon={<I.Sun s={14} />} label="Light Mode" action={() => setTheme('light')} active={theme === 'light'} />
        <Item icon={<I.Moon s={14} />} label="Dark Mode" action={() => setTheme('dark')} active={theme === 'dark'} />
      </Section>
      <div style={{ height: 1, background: 'var(--border-subtle)', margin: '6px 8px' }} />
      <Section title="Gantt Chart">
        <Item icon={<I.Link s={14} />} label="Show Arrows" action={() => setShowArrows(!showArrows)} active={showArrows} />
      </Section>
      <div style={{ height: 1, background: 'var(--border-subtle)', margin: '6px 8px' }} />
      <Section title="Export Data">
        <Item icon={<I.DL s={14} />} label="Export PDF" action={onExportPDF} />
        <Item icon={<I.Chat s={14} />} label="Export Markdown" action={onExportMD} />
        <Item icon={<I.List s={14} />} label="Export CSV" action={onExportCSV} />
      </Section>
    </div>
  );

  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <button 
        ref={btnRef}
        onClick={() => setOpen(!open)}
        style={{ 
          display: 'flex', alignItems: 'center', gap: 6, 
          background: open ? 'var(--hover)' : 'var(--bg)', 
          border: '1px solid var(--border)', 
          borderRadius: 6, padding: '7px 12px', color: 'var(--text-main)', fontSize: 13, 
          cursor: 'pointer', fontFamily: FONT, fontWeight: 600, transition: 'all .2s',
          boxShadow: open ? 'inset 0 2px 4px rgba(0,0,0,0.05)' : 'none'
        }}
        data-tooltip="Settings & Export"
        data-tooltip-pos="bottom"
        onMouseEnter={e => !open && (e.currentTarget.style.background = 'var(--hover)')}
        onMouseLeave={e => !open && (e.currentTarget.style.background = 'var(--bg)')}
      >
        <I.Cog s={15} />
        <span>Settings</span>
        <I.Chev open={open} s={10} />
      </button>
      {open && createPortal(Popover, document.body)}
    </div>
  );
};
