import { useState, useRef, useEffect, type CSSProperties } from "react";
import type { Task } from "./types.ts";
import { MEMBERS, PRIORITIES, TAGS, TC, fmt, today, addD, uid } from "./constants.ts";
import { I } from "./Icons.tsx";

import { DatePicker } from "./DatePicker.tsx";

interface Props {
  onClose: () => void;
  onAdd: (task: Task) => void;
  defaultStatus: string;
  toast: (msg: string, color?: string) => void;
}

export const NewTaskModal = ({ onClose, onAdd, defaultStatus, toast: addToast }: Props) => {
  const [f, sF] = useState({
    title: '', desc: '', assignee: "Unassigned", priority: 'Medium',
    tags: [] as string[], estHours: 8, ganttStart: fmt(today), deadline: fmt(addD(today, 7)),
    status: (defaultStatus || 'todo') as Task["status"]
  });
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [onClose]);

  const submit = () => {
    if (!f.title.trim()) return;
    const task: Task = { ...f, id: uid(), comments: [], created: fmt(today), subtasks: [], dependencies: [], progress: 0 };
    if (f.status === 'inprogress') {
      task.ganttStart = f.ganttStart;
      task.ganttEnd = f.deadline;
      task.deadline = f.deadline;
    }
    if (f.status === 'completed') task.completedDate = fmt(today);
    onAdd(task); onClose(); addToast('Task created', '#4ec9b0');
  };

  const is: CSSProperties = { background: '#2d2d2d', color: '#ccc', border: '1px solid #3c3c3c', borderRadius: 4, padding: '6px 10px', fontSize: 13, outline: 'none', fontFamily: 'inherit', width: '100%', boxSizing: 'border-box', transition: 'border-color .2s, box-shadow .2s' };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)', zIndex: 5000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(3px)' }}>
      <style>{`
        .date-input-wrap:focus-within {
          border-color: #007acc !important;
          box-shadow: 0 0 0 2px rgba(0, 122, 204, 0.2);
        }
      `}</style>
      <div ref={ref} style={{ background: '#1e1e1e', border: '1px solid #3c3c3c', borderRadius: 8, width: 480, boxShadow: '0 20px 60px rgba(0,0,0,.5)', animation: 'slideIn .2s ease-out' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #2d2d2d', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ color: '#d4d4d4', fontSize: 16, fontWeight: 600 }}>New Task</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', padding: 4 }}><I.X /></button>
        </div>
        <div style={{ padding: '14px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div><label style={{ color: '#888', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', marginBottom: 4, display: 'block' }}>Title *</label><input value={f.title} onChange={e => sF({ ...f, title: e.target.value })} style={is} autoFocus placeholder="What needs to be done?" /></div>
          <div><label style={{ color: '#888', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', marginBottom: 4, display: 'block' }}>Description</label><textarea value={f.desc} onChange={e => sF({ ...f, desc: e.target.value })} style={{ ...is, minHeight: 60, resize: 'vertical' }} placeholder="Add details..." /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div><label style={{ color: '#888', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', marginBottom: 4, display: 'block' }}>Assignee</label><select value={f.assignee} onChange={e => sF({ ...f, assignee: e.target.value })} style={is}>{MEMBERS.map(m => <option key={m}>{m}</option>)}</select></div>
            <div><label style={{ color: '#888', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', marginBottom: 4, display: 'block' }}>Priority</label><select value={f.priority} onChange={e => sF({ ...f, priority: e.target.value })} style={is}>{PRIORITIES.map(p => <option key={p}>{p}</option>)}</select></div>
            <div><label style={{ color: '#888', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', marginBottom: 4, display: 'block' }}>Est. Hours</label><input type="number" value={f.estHours} onChange={e => sF({ ...f, estHours: +e.target.value })} style={is} /></div>
            
            <div>
              <label style={{ color: '#888', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', marginBottom: 4, display: 'block' }}>Start Date</label>
              <DatePicker value={f.ganttStart} onChange={v => sF({ ...f, ganttStart: v })} />
            </div>

            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ color: '#888', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', marginBottom: 4, display: 'block' }}>Deadline</label>
              <DatePicker value={f.deadline} onChange={v => sF({ ...f, deadline: v })} />
            </div>
          </div>
          <div><label style={{ color: '#888', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Tags</label><div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>{TAGS.map(t => <button key={t} onClick={() => sF({ ...f, tags: f.tags.includes(t) ? f.tags.filter(x => x !== t) : [...f.tags, t] })} style={{ background: f.tags.includes(t) ? TC[t] : '#252526', color: f.tags.includes(t) ? '#ddd' : '#888', border: '1px solid ' + (f.tags.includes(t) ? 'transparent' : '#3c3c3c'), fontSize: 11, padding: '3px 10px', borderRadius: 12, cursor: 'pointer', transition: 'all .15s' }}>{t}</button>)}</div></div>
          <button onClick={submit} style={{ background: '#007acc', color: '#fff', border: 'none', borderRadius: 4, padding: '10px 16px', fontSize: 14, fontWeight: 600, cursor: 'pointer', marginTop: 6, transition: 'background .2s' }}>Create Task</button>
        </div>
      </div>
    </div>
  );
};
