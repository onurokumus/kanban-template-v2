import { useState, useRef, useEffect, type CSSProperties } from "react";
import type { Task } from "./types.ts";
import { MEMBERS, PRIORITIES, TAGS, MC, PC, TC, coid, sid } from "./constants.ts";
import { I, Av } from "./Icons.tsx";

interface Props {
  task: Task;
  onClose: () => void;
  onUpdate: (id: string, u: Partial<Task>) => void;
  onDelete: (id: string) => void;
  allTasks: Task[];
  toast: (msg: string, color?: string) => void;
}

type TabKey = "details" | "subtasks" | "dependencies" | "comments" | "activity";

export const TaskModal = ({ task, onClose, onUpdate, onDelete, allTasks, toast }: Props) => {
  const [tab, setTab] = useState<TabKey>("details");
  const [ef, setEf] = useState<string | null>(null);
  const [ev, setEv] = useState("");
  const [ct, setCt] = useState("");
  const [showMentions, setShowMentions] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [onClose]);

  const startE = (f: string, v: string | number | undefined) => { setEf(f); setEv(String(v ?? '')); };
  const saveE = (f: string) => {
    const val = f === 'estHours' ? +ev : ev;
    onUpdate(task.id, { [f]: val } as Partial<Task>);
    setEf(null);
    toast('Field updated', '#4ec9b0');
  };

  const addComment = () => {
    if (!ct.trim()) return;
    const nc = [...(task.comments || []), { id: coid(), author: "Onur", text: ct, ts: new Date().toISOString() }];
    onUpdate(task.id, { comments: nc });
    setCt('');
    toast('Comment added', '#007acc');
  };

  const handleCommentInput = (val: string) => {
    setCt(val);
    const lastAt = val.lastIndexOf('@');
    if (lastAt >= 0 && lastAt === val.length - 1) { setShowMentions(true); }
    else if (lastAt >= 0) {
      const after = val.slice(lastAt + 1);
      if (!after.includes(' ') && after.length < 15) setShowMentions(true);
      else setShowMentions(false);
    } else setShowMentions(false);
  };

  const insertMention = (name: string) => {
    const lastAt = ct.lastIndexOf('@');
    const before = ct.slice(0, lastAt);
    setCt(before + '@' + name + ' ');
    setShowMentions(false);
    inputRef.current?.focus();
  };

  const toggleSub = (sId: string) => {
    const subs = task.subtasks.map(s => s.id === sId ? { ...s, done: !s.done } : s);
    const doneCount = subs.filter(s => s.done).length;
    const progress = subs.length > 0 ? Math.round(doneCount / subs.length * 100) : (task.progress || 0);
    onUpdate(task.id, { subtasks: subs, progress });
  };

  const addSub = () => {
    const title = prompt('Subtask title:');
    if (!title?.trim()) return;
    const subs = [...(task.subtasks || []), { id: sid(), title, done: false }];
    const progress = subs.length > 0 ? Math.round(subs.filter(s => s.done).length / subs.length * 100) : 0;
    onUpdate(task.id, { subtasks: subs, progress });
    toast('Subtask added', '#4ec9b0');
  };

  const delSub = (sId: string) => {
    const subs = task.subtasks.filter(s => s.id !== sId);
    const progress = subs.length > 0 ? Math.round(subs.filter(s => s.done).length / subs.length * 100) : 0;
    onUpdate(task.id, { subtasks: subs, progress });
  };

  const toggleDep = (depId: string) => {
    const deps = task.dependencies || [];
    const newDeps = deps.includes(depId) ? deps.filter(d => d !== depId) : [...deps, depId];
    onUpdate(task.id, { dependencies: newDeps });
    toast(deps.includes(depId) ? 'Dependency removed' : 'Dependency added', '#c586c0');
  };

  const ips: CSSProperties = { background: '#2d2d2d', color: '#ccc', border: '1px solid #007acc', borderRadius: 3, padding: '4px 8px', fontSize: 12, outline: 'none', fontFamily: 'inherit' };

  const fieldR = (label: string, field: string, value: string | number, type = 'text') => (
    <div style={{ display: 'flex', alignItems: 'flex-start', padding: '7px 0', borderBottom: '1px solid #2d2d2d', gap: 10 }}>
      <span style={{ width: 105, flexShrink: 0, color: '#888', fontSize: 11, paddingTop: 3 }}>{label}</span>
      {ef === field ? (
        <div style={{ display: 'flex', gap: 6, flex: 1, alignItems: 'center' }}>
          {type === 'sp' ? <select value={ev} onChange={e => setEv(e.target.value)} style={ips}>{PRIORITIES.map(p => <option key={p}>{p}</option>)}</select>
            : type === 'sm' ? <select value={ev} onChange={e => setEv(e.target.value)} style={ips}>{MEMBERS.map(m => <option key={m}>{m}</option>)}</select>
              : type === 'ta' ? <textarea value={ev} onChange={e => setEv(e.target.value)} rows={3} style={{ ...ips, flex: 1, resize: 'vertical' }} autoFocus />
                : type === 'number' ? <input type="number" value={ev} onChange={e => setEv(e.target.value)} style={{ ...ips, width: 80 }} autoFocus />
                  : <input type={type} value={ev} onChange={e => setEv(e.target.value)} style={{ ...ips, flex: 1 }} autoFocus />}
          <button onClick={() => saveE(field)} style={{ background: '#007acc', color: '#fff', border: 'none', borderRadius: 3, padding: '4px 10px', fontSize: 11, cursor: 'pointer' }}>Save</button>
          <button onClick={() => setEf(null)} style={{ background: '#3c3c3c', color: '#aaa', border: 'none', borderRadius: 3, padding: '4px 10px', fontSize: 11, cursor: 'pointer' }}>✕</button>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', minHeight: 20 }} onClick={() => startE(field, value)}>
          {field === 'priority' ? <span style={{ color: PC[value as string], fontSize: 12, fontWeight: 600 }}>{value}</span>
            : field === 'assignee' ? <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Av name={value as string} size={20} /><span style={{ color: '#ccc', fontSize: 12 }}>{value}</span></div>
              : <span style={{ color: '#ccc', fontSize: 12 }}>{value || '—'}</span>}
          <span style={{ marginLeft: 'auto', opacity: .2 }}><I.Edit /></span>
        </div>
      )}
    </div>
  );

  const renderComment = (text: string) => {
    const parts = text.split(/(@\w+)/g);
    return parts.map((p, i) => p.startsWith('@') ? <span key={i} style={{ color: MC[p.slice(1)] || '#007acc', fontWeight: 600 }}>{p}</span> : <span key={i}>{p}</span>);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)', zIndex: 5000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(3px)' }}>
      <div ref={ref} style={{ background: '#1e1e1e', border: '1px solid #3c3c3c', borderRadius: 8, width: 680, maxHeight: '88vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,.5)' }}>
        {/* Header */}
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #2d2d2d', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ color: PC[task.priority], fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', background: PC[task.priority] + '18', padding: '3px 8px', borderRadius: 3 }}>{task.priority}</span>
          <span style={{ color: '#d4d4d4', fontSize: 14, fontWeight: 600, flex: 1 }}>{task.title}</span>
          <button onClick={() => { onDelete(task.id); onClose(); toast('Task deleted', '#f44747'); }} style={{ background: 'none', border: 'none', color: '#f44747', cursor: 'pointer', padding: 4, opacity: .5 }} title="Delete"><I.Trash /></button>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', padding: 4 }}><I.X /></button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #2d2d2d', padding: '0 20px' }}>
          {(["details", "subtasks", "dependencies", "comments", "activity"] as TabKey[]).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ padding: '9px 14px', background: 'none', border: 'none', borderBottom: tab === t ? '2px solid #007acc' : '2px solid transparent', color: tab === t ? '#d4d4d4' : '#888', fontSize: 11, fontWeight: 500, cursor: 'pointer', textTransform: 'capitalize', marginBottom: -1 }}>
              {t}{t === 'comments' ? ` (${(task.comments || []).length})` : t === 'subtasks' ? ` (${(task.subtasks || []).filter(s => s.done).length}/${(task.subtasks || []).length})` : t === 'dependencies' ? ` (${(task.dependencies || []).length})` : ''}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ padding: '14px 20px', overflowY: 'auto', flex: 1 }}>
          {tab === 'details' && <div>
            {fieldR('Title', 'title', task.title)}
            {fieldR('Description', 'desc', task.desc, 'ta')}
            {fieldR('Assignee', 'assignee', task.assignee, 'sm')}
            {fieldR('Priority', 'priority', task.priority, 'sp')}
            {fieldR('Est. Hours', 'estHours', task.estHours, 'number')}
            {fieldR('Deadline', 'deadline', task.deadline, 'date')}
            {task.status === 'inprogress' && fieldR('Gantt Start', 'ganttStart', task.ganttStart || '', 'date')}
            {task.status === 'inprogress' && fieldR('Gantt End', 'ganttEnd', task.ganttEnd || '', 'date')}
            <div style={{ padding: '7px 0', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <span style={{ width: 105, flexShrink: 0, color: '#888', fontSize: 11 }}>Tags</span>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>{TAGS.map(t => (
                <button key={t} onClick={() => { const c = task.tags || []; onUpdate(task.id, { tags: c.includes(t) ? c.filter(x => x !== t) : [...c, t] }); }} style={{ background: (task.tags || []).includes(t) ? TC[t] : '#2d2d2d', color: (task.tags || []).includes(t) ? '#ddd' : '#666', border: '1px solid ' + ((task.tags || []).includes(t) ? 'transparent' : '#3c3c3c'), fontSize: 10, padding: '2px 8px', borderRadius: 3, cursor: 'pointer' }}>{t}</button>
              ))}</div>
            </div>
            <div style={{ padding: '7px 0', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ width: 105, flexShrink: 0, color: '#888', fontSize: 11 }}>Progress</span>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ flex: 1, height: 6, borderRadius: 3, background: '#333' }}>
                  <div style={{ width: `${task.progress || 0}%`, height: '100%', borderRadius: 3, background: MC[task.assignee], transition: 'width .2s' }} />
                </div>
                <span style={{ fontSize: 11, color: MC[task.assignee], fontWeight: 600 }}>{task.progress || 0}%</span>
              </div>
            </div>
            <div style={{ marginTop: 8, fontSize: 10, color: '#555', display: 'flex', gap: 12 }}>
              <span>Created: {task.created}</span>
              {task.completedDate && <span>Completed: {task.completedDate}</span>}
              <span>Status: <span style={{ color: '#007acc', textTransform: 'capitalize' }}>{task.status === 'inprogress' ? 'In Progress' : task.status}</span></span>
            </div>
          </div>}

          {tab === 'subtasks' && <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 12, color: '#999' }}>Track progress with subtasks</span>
              <button onClick={addSub} style={{ background: '#007acc', color: '#fff', border: 'none', borderRadius: 3, padding: '4px 12px', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}><I.Plus />Add</button>
            </div>
            {(task.subtasks || []).length > 0 && <div style={{ height: 4, borderRadius: 2, background: '#333', marginBottom: 12 }}>
              <div style={{ width: `${task.progress || 0}%`, height: '100%', borderRadius: 2, background: MC[task.assignee], transition: 'width .3s' }} />
            </div>}
            {(task.subtasks || []).map(s => (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0', borderBottom: '1px solid #2d2d2d' }}>
                <div onClick={() => toggleSub(s.id)} style={{ width: 18, height: 18, borderRadius: 3, border: `1.5px solid ${s.done ? MC[task.assignee] : '#555'}`, background: s.done ? MC[task.assignee] + '22' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                  {s.done && <I.Check />}
                </div>
                <span style={{ flex: 1, fontSize: 12, color: s.done ? '#666' : '#ccc', textDecoration: s.done ? 'line-through' : 'none' }}>{s.title}</span>
                <button onClick={() => delSub(s.id)} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', padding: 2 }}><I.Trash /></button>
              </div>
            ))}
            {(task.subtasks || []).length === 0 && <p style={{ color: '#444', fontSize: 12, textAlign: 'center', padding: 20 }}>No subtasks. Click "Add" to break this task down.</p>}
          </div>}

          {tab === 'dependencies' && <div>
            <p style={{ fontSize: 12, color: '#999', marginBottom: 12 }}>Select tasks that must be completed before this one:</p>
            {allTasks.filter(t => t.id !== task.id && t.status !== 'completed').map(t => (
              <div key={t.id} onClick={() => toggleDep(t.id)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 4, cursor: 'pointer', marginBottom: 4, background: (task.dependencies || []).includes(t.id) ? '#007acc15' : '#252526', border: `1px solid ${(task.dependencies || []).includes(t.id) ? '#007acc44' : '#2d2d2d'}` }}>
                <div style={{ width: 16, height: 16, borderRadius: 3, border: `1.5px solid ${(task.dependencies || []).includes(t.id) ? '#007acc' : '#555'}`, background: (task.dependencies || []).includes(t.id) ? '#007acc22' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {(task.dependencies || []).includes(t.id) && <I.Check />}
                </div>
                <Av name={t.assignee} size={18} />
                <span style={{ fontSize: 12, color: '#ccc', flex: 1 }}>{t.title}</span>
                <span style={{ fontSize: 9, color: PC[t.priority], fontWeight: 600 }}>{t.priority}</span>
              </div>
            ))}
          </div>}

          {tab === 'comments' && <div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 14, position: 'relative' }}>
              <Av name="Onur" size={28} />
              <div style={{ flex: 1, position: 'relative' }}>
                <div style={{ display: 'flex', gap: 6 }}>
                  <input ref={inputRef} value={ct} onChange={e => handleCommentInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') addComment(); }} placeholder="Add a comment... (@ to mention)" style={{ flex: 1, background: '#2d2d2d', color: '#ccc', border: '1px solid #3c3c3c', borderRadius: 4, padding: '7px 10px', fontSize: 12, outline: 'none', fontFamily: 'inherit' }} />
                  <button onClick={addComment} style={{ background: '#007acc', border: 'none', borderRadius: 4, padding: '7px 10px', cursor: 'pointer', color: '#fff' }}><I.Send /></button>
                </div>
                {showMentions && <div style={{ position: 'absolute', top: '100%', left: 0, background: '#252526', border: '1px solid #3c3c3c', borderRadius: 4, padding: 4, zIndex: 100, boxShadow: '0 4px 12px rgba(0,0,0,.4)', marginTop: 4, width: 180 }}>
                  {MEMBERS.map(m => (
                    <button key={m} onClick={() => insertMention(m)} style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%', padding: '5px 8px', background: 'none', border: 'none', color: '#ccc', fontSize: 12, cursor: 'pointer', borderRadius: 3, fontFamily: 'inherit' }} onMouseEnter={e => (e.currentTarget.style.background = '#2d2d2d')} onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                      <Av name={m} size={18} />{m}
                    </button>
                  ))}
                </div>}
              </div>
            </div>
            {(task.comments || []).slice().reverse().map(c => (
              <div key={c.id} style={{ display: 'flex', gap: 8, padding: '9px 0', borderBottom: '1px solid #2d2d2d' }}>
                <Av name={c.author} size={24} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: '#d4d4d4', fontSize: 12, fontWeight: 600 }}>{c.author}</span>
                    <span style={{ color: '#555', fontSize: 10 }}>{new Date(c.ts).toLocaleString()}</span>
                    <button onClick={() => { onUpdate(task.id, { comments: task.comments.filter(x => x.id !== c.id) }); toast('Comment deleted'); }} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#555', cursor: 'pointer', padding: 2 }}><I.Trash /></button>
                  </div>
                  <p style={{ color: '#aaa', fontSize: 12, margin: '3px 0 0', lineHeight: 1.5 }}>{renderComment(c.text)}</p>
                </div>
              </div>
            ))}
            {(task.comments || []).length === 0 && <p style={{ color: '#444', fontSize: 12, textAlign: 'center', padding: 20 }}>No comments yet.</p>}
          </div>}

          {tab === 'activity' && <div style={{ color: '#888', fontSize: 12 }}>
            {[
              { dot: '#007acc', text: `Task created on ${task.created}` },
              ...(task.status === 'inprogress' ? [{ dot: '#dcdcaa', text: `Moved to In Progress — started ${task.ganttStart}` }] : []),
              ...(task.status === 'completed' ? [{ dot: '#4ec9b0', text: `Completed on ${task.completedDate}` }] : []),
              ...(task.dependencies || []).map(dId => { const dt = allTasks.find(t => t.id === dId); return { dot: '#c586c0', text: `Depends on: ${dt?.title || dId}` }; }),
              ...(task.comments || []).map(c => ({ dot: MC[c.author] || '#888', text: `${c.author} commented — ${new Date(c.ts).toLocaleString()}` })),
            ].map((e, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: e.dot, flexShrink: 0 }} />
                <span>{e.text}</span>
              </div>
            ))}
          </div>}
        </div>
      </div>
    </div>
  );
};
