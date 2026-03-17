import type { CSSProperties, ReactNode } from "react";

export const I = {
  Chev: ({ open, s = 14 }: { open: boolean; s?: number }) => <svg width={s} height={s} viewBox="0 0 16 16" fill="none" style={{ transform: `rotate(${open ? 90 : 0}deg)`, transition: 'transform .15s' }}><path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>,
  Plus: () => <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>,
  X: () => <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>,
  Clock: () => <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.3" /><path d="M8 5v3.5l2.5 1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>,
  Cal: () => <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><rect x="2" y="3" width="12" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.3" /><path d="M2 6.5h12M5.5 2v2.5M10.5 2v2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>,
  Chat: () => <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M2.5 3h11a1 1 0 011 1v7a1 1 0 01-1 1H5l-2.5 2V4a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.3" /></svg>,
  Chart: () => <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><rect x="2" y="8" width="3" height="6" rx=".5" fill="currentColor" opacity=".7" /><rect x="6.5" y="5" width="3" height="9" rx=".5" fill="currentColor" opacity=".85" /><rect x="11" y="2" width="3" height="12" rx=".5" fill="currentColor" /></svg>,
  Send: () => <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M2 2l12 6-12 6V9l8-1-8-1V2z" fill="currentColor" /></svg>,
  Edit: () => <svg width="11" height="11" viewBox="0 0 16 16" fill="none"><path d="M11.5 1.5l3 3L5 14H2v-3L11.5 1.5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" /></svg>,
  Trash: () => <svg width="11" height="11" viewBox="0 0 16 16" fill="none"><path d="M3 4h10M5.5 4V2.5h5V4M4.5 4v9.5h7V4" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" /></svg>,
  Search: () => <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.3" /><path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>,
  Filter: () => <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M2 3h12L9 8.5V13l-2-1V8.5L2 3z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" /></svg>,
  Undo: () => <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M4 6l-3 3 3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /><path d="M1 9h9a4 4 0 010 8H6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>,
  Redo: () => <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M12 6l3 3-3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /><path d="M15 9H6a4 4 0 000 8h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>,
  DL: () => <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M8 2v8m0 0l-3-3m3 3l3-3M3 13h10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>,
  Link: () => <svg width="11" height="11" viewBox="0 0 16 16" fill="none"><path d="M7 9l2-2m-3 .5L3.5 10A2.5 2.5 0 007 13.5L9.5 11m-3-6L9 2.5A2.5 2.5 0 0112.5 6L10 8.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>,
  Check: () => <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M3.5 8.5L6.5 11.5 12.5 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>,
  Diamond: ({ s = 10, c = "#dcdcaa" }: { s?: number; c?: string }) => <svg width={s} height={s} viewBox="0 0 10 10"><rect x="5" y="0" width="7" height="7" rx="1" transform="rotate(45 5 0)" fill={c} /></svg>,
  Kbd: ({ children }: { children: ReactNode }) => <span style={{ background: '#2d2d2d', border: '1px solid #444', borderRadius: 3, padding: '0 5px', fontSize: 10, color: '#999', fontFamily: 'monospace', lineHeight: '18px', display: 'inline-block' } as CSSProperties}>{children}</span>,
  ZoomIn: () => <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.3" /><path d="M5 7h4M7 5v4M11 11l3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>,
  ZoomOut: () => <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.3" /><path d="M5 7h4M11 11l3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>,
};

export const Av = ({ name, size = 28 }: { name: string; size?: number }) => {
  const c = MC[name] || "#888";
  return <div style={{ width: size, height: size, borderRadius: '50%', background: c + '22', border: `1.5px solid ${c}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * .36, fontWeight: 600, color: c, flexShrink: 0, letterSpacing: '-.02em' }}>{name.slice(0, 2).toUpperCase()}</div>;
};

// Importing MC here to avoid circular dependency issues - we import from constants
import { MC } from "./constants.ts";
