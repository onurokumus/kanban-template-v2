import type { CSSProperties, ReactNode } from "react";

export const I = {
  Chev: ({ open, s = 14 }: { open: boolean; s?: number }) => <svg width={s} height={s} viewBox="0 0 16 16" fill="none" style={{ transform: `rotate(${open ? 90 : 0}deg)`, transition: 'transform .15s' }}><path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>,
  Plus: ({ s = 14 }: { s?: number }) => <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>,
  Minus: ({ s = 14 }: { s?: number }) => <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><path d="M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>,
  Expand: ({ s = 14 }: { s?: number }) => <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><path d="M12 5l-4-4-4 4M4 11l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>,
  Collapse: ({ s = 14 }: { s?: number }) => <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><path d="M4 2l4 4 4-4M12 14l-4-4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>,
  X: ({ s = 14 }: { s?: number }) => <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>,
  Clock: ({ s = 12 }: { s?: number }) => <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.3" /><path d="M8 5v3.5l2.5 1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>,
  Cal: ({ s = 12 }: { s?: number }) => <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><rect x="2" y="3" width="12" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.3" /><path d="M2 6.5h12M5.5 2v2.5M10.5 2v2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>,
  Chat: ({ s = 12 }: { s?: number }) => <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><path d="M2.5 3h11a1 1 0 011 1v7a1 1 0 01-1 1H5l-2.5 2V4a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.3" /></svg>,
  Chart: ({ s = 14 }: { s?: number }) => <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><rect x="2" y="8" width="3" height="6" rx=".5" fill="currentColor" opacity=".7" /><rect x="6.5" y="5" width="3" height="9" rx=".5" fill="currentColor" opacity=".85" /><rect x="11" y="2" width="3" height="12" rx=".5" fill="currentColor" /></svg>,
  Send: ({ s = 14 }: { s?: number }) => <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><path d="M2 2l12 6-12 6V9l8-1-8-1V2z" fill="currentColor" /></svg>,
  Edit: ({ s = 11 }: { s?: number }) => <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><path d="M11.5 1.5l3 3L5 14H2v-3L11.5 1.5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" /></svg>,
  Trash: ({ s = 11 }: { s?: number }) => <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><path d="M3 4h10M5.5 4V2.5h5V4M4.5 4v9.5h7V4" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" /></svg>,
  Search: ({ s = 14 }: { s?: number }) => <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.3" /><path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>,
  Filter: ({ s = 13 }: { s?: number }) => <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><path d="M2 3h12L9 8.5V13l-2-1V8.5L2 3z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" /></svg>,
  Undo: ({ s = 13 }: { s?: number }) => <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><path d="M4 6l-3 3 3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /><path d="M1 9h9a4 4 0 010 8H6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>,
  Redo: ({ s = 13 }: { s?: number }) => <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><path d="M12 6l3 3-3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /><path d="M15 9H6a4 4 0 000 8h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>,
  DL: ({ s = 13 }: { s?: number }) => <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><path d="M8 2v8m0 0l-3-3m3 3l3-3M3 13h10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>,
  Link: ({ s = 14 }: { s?: number }) => <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><path d="M7 9l2-2m-3 .5L3.5 10A2.5 2.5 0 007 13.5L9.5 11m-3-6L9 2.5A2.5 2.5 0 0112.5 6L10 8.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>,
  Check: ({ s = 12 }: { s?: number }) => <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><path d="M3.5 8.5L6.5 11.5 12.5 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>,
  Diamond: ({ s = 10, c = "var(--prio-medium)" }: { s?: number; c?: string }) => <svg width={s} height={s} viewBox="0 0 10 10"><rect x="5" y="0" width="7" height="7" rx="1" transform="rotate(45 5 0)" fill={c} /></svg>,
  Kbd: ({ children }: { children: ReactNode }) => <span style={{ background: 'var(--kbd-bg)', border: '1px solid var(--kbd-border)', borderRadius: 3, padding: '0 5px', fontSize: 11, color: 'var(--text-dim)', fontFamily: 'monospace', lineHeight: '18px', display: 'inline-block' } as CSSProperties}>{children}</span>,
  ZoomIn: () => <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.3" /><path d="M5 7h4M7 5v4M11 11l3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>,
  ZoomOut: () => <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.3" /><path d="M5 7h4M11 11l3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>,
  Sun: ({ s = 14 }: { s?: number }) => <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.5"/><path d="M8 1.5v1.5M8 13v1.5M1.5 8h1.5M13 8h1.5M3.4 3.4l1 1M11.6 11.6l1 1M3.4 12.6l1-1M11.6 4.4l1-1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  Moon: ({ s = 14 }: { s?: number }) => <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><path d="M14.5 9.5a6 6 0 11-8-8 4.5 4.5 0 008 8z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  Img: ({ s = 14 }: { s?: number }) => <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><rect x="2" y="3" width="12" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><circle cx="5.5" cy="6.5" r="1.5" fill="currentColor"/><path d="M2.5 11.5l3.5-3.5 3 3 2.5-2.5 2 2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  Code: ({ s = 14 }: { s?: number }) => <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><path d="M5 5l-3 3 3 3M11 5l3 3-3 3M9 3l-2 10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  List: ({ s = 14 }: { s?: number }) => <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><path d="M6 4h8M6 8h8M6 12h8M2.5 4h.5M2.5 8h.5M2.5 12h.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
  Cog: ({ s = 14 }: { s?: number }) => <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><path d="M8 5.5a2.5 2.5 0 100 5 2.5 2.5 0 000-5z" fill="currentColor"/><path d="M14.5 7.2l-1.3-.3a5 5 0 00-.7-1.6l.8-1a.5.5 0 000-.6l-1-1a.5.5 0 00-.6 0l-1 .8a5 5 0 00-1.6-.7l-.3-1.3a.5.5 0 00-.5-.4h-1.4a.5.5 0 00-.5.4l-.3 1.3a5 5 0 00-1.6.7l-1-.8a.5.5 0 00-.6 0l-1 1a.5.5 0 000 .6l.8 1a5 5 0 00-.7 1.6l-1.3.3a.5.5 0 00-.4.5v1.4a.5.5 0 00.4.5l1.3.3a5 5 0 00.7 1.6l-.8 1a.5.5 0 000 .6l1 1a.5.5 0 00.6 0l1-.8a5 5 0 001.6.7l.3 1.3a.5.5 0 00.5.4h1.4a.5.5 0 00.5-.4l.3-1.3a5 5 0 001.6-.7l1 .8a.5.5 0 00.6 0l1-1a.5.5 0 000-.6l-.8-1a5 5 0 00.7-1.6l1.3-.3a.5.5 0 00.4-.5V8a.5.5 0 00-.4-.5z" fill="currentColor" opacity=".5"/><circle cx="8" cy="8" r="1.5" fill="var(--bg)"/></svg>,
};

export const Av = ({ name, size = 28 }: { name: string; size?: number }) => {
  const c = MC[name] || "#888";
  const isU = name === "Unassigned";
  // For CSS variables, we can't easily append '22' for opacity if it's already a var(...)
  // We'll use a style that works for both hex and var
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: isU ? 'transparent' : `color-mix(in srgb, ${c}, transparent 85%)`,
      border: isU ? `1.5px dashed ${c}` : `1.5px solid ${c}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * .36, fontWeight: 700, color: c, flexShrink: 0,
      letterSpacing: '-.02em', overflow: 'hidden'
    }}>
      {isU ? <span style={{ fontSize: size * 0.6 }}>?</span> : name.slice(0, 2).toUpperCase()}
    </div>
  );
};

// Importing MC here to avoid circular dependency issues - we import from constants
import { MC } from "./constants.ts";
