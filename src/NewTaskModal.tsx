import { useState, useRef, useEffect, type CSSProperties } from "react";
import type { Task } from "./types.ts";
import { MEMBERS, PRIORITIES, TAGS, TC, fmt, today, addD, uid } from "./constants.ts";
import { I } from "./Icons.tsx";

interface Props {
  onClose: () => void;
  onAdd: (task: Task) => void;
  defaultStatus: string;
  toast: (msg: string, color?: string) => void;
}

export const NewTaskModal = ({ onClose, onAdd, defaultStatus, toast: addToast }: Props) => {
  const [f, sF] = useState({
    title: '', desc: '', assignee: MEMBERS[0] as string, priority: 'Medium',
    tags: [] as string[], estHours: 8, deadline: fmt(addD(today, 7)),
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
    if (f.status === 'inprogress') { task.ganttStart = fmt(today); task.ganttEnd = fmt(addD(today, Math.max(1, Math.ceil(f.estHours / 8)))); }
    if (f.status === 'completed') task.completedDate = fmt(today);
    onAdd(task); onClose(); addToast('Task created', '#4ec9b0');
  };

  const is: CSSProperties = { background: '#2d2d2d', color: '#ccc', border: '1px solid #3c3c3c', borderRadius: 4, padding: '6px 10px', fontSize: 12, outline: 'none', fontFamily: 'inherit', width: '100%', boxSizing: 'border-box' };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)', zIndex: 5000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(3px)' }}>
      <div ref={ref} style={{ background: '#1e1e1e', border: '1px solid #3c3c3c', borderRadius: 8, width: 480, boxShadow: '0 20px 60px rgba(0,0,0,.5)' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #2d2d2d', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ color: '#d4d4d4', fontSize: 14, fontWeight: 600 }}>New Task</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer' }}><I.X /></button>
        </div>
        <div style={{ padding: '14px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div><label style={{ color: '#888', fontSize: 10, display: 'block', marginBottom: 3 }}>Title *</label><input value={f.title} onChange={e => sF({ ...f, title: e.target.value })} style={is} autoFocus placeholder="Task title" /></div>
          <div><label style={{ color: '#888', fontSize: 10, display: 'block', marginBottom: 3 }}>Description</label><textarea value={f.desc} onChange={e => sF({ ...f, desc: e.target.value })} style={{ ...is, minHeight: 50, resize: 'vertical' }} placeholder="Description" /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div><label style={{ color: '#888', fontSize: 10, display: 'block', marginBottom: 3 }}>Assignee</label><select value={f.assignee} onChange={e => sF({ ...f, assignee: e.target.value })} style={is}>{MEMBERS.map(m => <option key={m}>{m}</option>)}</select></div>
            <div><label style={{ color: '#888', fontSize: 10, display: 'block', marginBottom: 3 }}>Priority</label><select value={f.priority} onChange={e => sF({ ...f, priority: e.target.value })} style={is}>{PRIORITIES.map(p => <option key={p}>{p}</option>)}</select></div>
            <div><label style={{ color: '#888', fontSize: 10, display: 'block', marginBottom: 3 }}>Est. Hours</label><input type="number" value={f.estHours} onChange={e => sF({ ...f, estHours: +e.target.value })} style={is} /></div>
            <div><label style={{ color: '#888', fontSize: 10, display: 'block', marginBottom: 3 }}>Deadline</label><input type="date" value={f.deadline} onChange={e => sF({ ...f, deadline: e.target.value })} style={is} /></div>
          </div>
          <div><label style={{ color: '#888', fontSize: 10, display: 'block', marginBottom: 3 }}>Tags</label><div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>{TAGS.map(t => <button key={t} onClick={() => sF({ ...f, tags: f.tags.includes(t) ? f.tags.filter(x => x !== t) : [...f.tags, t] })} style={{ background: f.tags.includes(t) ? TC[t] : '#2d2d2d', color: f.tags.includes(t) ? '#ddd' : '#666', border: '1px solid ' + (f.tags.includes(t) ? 'transparent' : '#3c3c3c'), fontSize: 10, padding: '3px 8px', borderRadius: 3, cursor: 'pointer' }}>{t}</button>)}</div></div>
          <button onClick={submit} style={{ background: '#007acc', color: '#fff', border: 'none', borderRadius: 4, padding: '8px 16px', fontSize: 12, fontWeight: 500, cursor: 'pointer', marginTop: 4 }}>Create Task</button>
        </div>
      </div>
    </div>
  );
};
