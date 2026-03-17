import { useState, useRef, useEffect, type CSSProperties } from "react";
import type { Task } from "./types.ts";
import { MEMBERS, PRIORITIES, TAGS, MC, PC, TC, TCT, coid, sid, fmt, today, addD } from "./constants.ts";
import { I, Av } from "./Icons.tsx";
import { DatePicker } from "./DatePicker.tsx";
import { ConfirmDialog } from "./ConfirmDialog.tsx";
import { SubtaskModal } from "./SubtaskModal.tsx";

interface Props {
  task: Task;
  onClose: () => void;
  onUpdate: (id: string, u: Partial<Task>, skipHistory?: boolean) => void;
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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editVal, setEditVal] = useState("");
  const [showMentions, setShowMentions] = useState(false);
  const [insertPopup, setInsertPopup] = useState<'link' | 'image' | null>(null);
  const [popupUrl, setPopupUrl] = useState('');
  const [popupText, setPopupText] = useState('');
  const [draggingFile, setDraggingFile] = useState(false);
  const [depSearch, setDepSearch] = useState("");
  const [depStatus, setDepStatus] = useState<'all' | 'todo' | 'inprogress' | 'completed'>('all');
  const [showSubModal, setShowSubModal] = useState(false);
  const [confirm, setConfirm] = useState<{ title: string, msg: string, onConfirm: () => void } | null>(null);
  const [draggedSubId, setDraggedSubId] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => { 
      if (ref.current && !ref.current.contains(e.target as Node) && !(e.target as Element).closest('.portal-node')) onClose(); 
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [onClose]);

  const startE = (f: string, v: string | number | undefined) => { setEf(f); setEv(String(v ?? '')); };
  const saveE = (f: string) => {
    const val = f === 'estHours' || f === 'actualHours' ? +ev : ev;
    const update: Partial<Task> = { [f]: val };
    if (f === 'deadline') update.ganttEnd = String(val);
    if (f === 'ganttEnd') update.deadline = String(val);
    onUpdate(task.id, update);
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

  const editComment = (cId: string) => {
    const nc = task.comments.map(c => c.id === cId ? { ...c, text: editVal, lastEdited: new Date().toISOString() } : c);
    onUpdate(task.id, { comments: nc });
    setEditingId(null);
    toast('Comment edited');
  };

  const handleFileUpload = (file: File) => {
    if (!file.type.startsWith('image/')) { toast('Only image files are supported', '#f44747'); return; }
    if (file.size > 5 * 1024 * 1024) { toast('Image must be under 5MB', '#f44747'); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setPopupUrl(dataUrl);
      if (!popupText) setPopupText(file.name.replace(/\.[^.]+$/, ''));
    };
    reader.readAsDataURL(file);
  };

  const toggleReact = (cId: string, emoji: string) => {
    const nc = task.comments.map(c => {
      if (c.id !== cId) return c;
      const r = { ...(c.reactions || {}) };
      r[emoji] = (r[emoji] || 0) + 1;
      return { ...c, reactions: r };
    });
    onUpdate(task.id, { comments: nc });
  };

  const handleCommentInput = (val: string, isEdit = false) => {
    if (isEdit) setEditVal(val); else setCt(val);
    const lastAt = val.lastIndexOf('@');
    if (lastAt >= 0 && lastAt === val.length - 1) { setShowMentions(true); }
    else if (lastAt >= 0) {
      const after = val.slice(lastAt + 1);
      if (!after.includes(' ') && after.length < 15) setShowMentions(true);
      else setShowMentions(false);
    } else setShowMentions(false);
  };

  const insertMention = (name: string) => {
    if (editingId) {
      const lastAt = editVal.lastIndexOf('@');
      const before = editVal.slice(0, lastAt);
      setEditVal(before + '@' + name + ' ');
    } else {
      const lastAt = ct.lastIndexOf('@');
      const before = ct.slice(0, lastAt);
      setCt(before + '@' + name + ' ');
    }
    setShowMentions(false);
    inputRef.current?.focus();
  };

  const toggleSub = (sId: string) => {
    const subs = task.subtasks.map(s => s.id === sId ? { ...s, done: !s.done } : s);
    const doneCount = subs.filter(s => s.done).length;
    const progress = subs.length > 0 ? Math.round(doneCount / subs.length * 100) : (task.progress || 0);
    onUpdate(task.id, { subtasks: subs, progress });
  };

  const addSub = (title: string) => {
    const subs = [...(task.subtasks || []), { 
      id: sid(), 
      title, 
      done: false, 
      ganttStart: task.ganttStart || fmt(today), 
      deadline: task.deadline || fmt(addD(today, 1)) 
    }];
    const doneCount = subs.filter(s => s.done).length;
    const progress = Math.round(doneCount / subs.length * 100);
    onUpdate(task.id, { subtasks: subs, progress });
    setShowSubModal(false);
    toast('Subtask added', '#4ec9b0');
  };

  const reorderSubs = (fromId: string, toId: string) => {
    const subs = [...(task.subtasks || [])];
    const fromIdx = subs.findIndex(s => s.id === fromId);
    const toIdx = subs.findIndex(s => s.id === toId);
    if (fromIdx === -1 || toIdx === -1) return;
    const [moved] = subs.splice(fromIdx, 1);
    subs.splice(toIdx, 0, moved);
    onUpdate(task.id, { subtasks: subs });
  };

  const delSub = (sId: string) => {
    setConfirm({
      title: 'Remove Subtask?',
      msg: 'Are you sure you want to remove this subtask?',
      onConfirm: () => {
        const subs = task.subtasks.filter(s => s.id !== sId);
        const progress = subs.length > 0 ? Math.round(subs.filter(s => s.done).length / subs.length * 100) : 0;
        onUpdate(task.id, { subtasks: subs, progress });
        setConfirm(null);
        toast('Subtask removed');
      }
    });
  };

  const toggleDep = (depId: string) => {
    const deps = task.dependencies || [];
    const newDeps = deps.includes(depId) ? deps.filter(d => d !== depId) : [...deps, depId];
    onUpdate(task.id, { dependencies: newDeps });
    toast(deps.includes(depId) ? 'Dependency removed' : 'Dependency added', '#c586c0');
  };

  const ips: CSSProperties = { background: 'var(--hover)', color: 'var(--text-dim)', border: '1px solid var(--border)', borderRadius: 4, padding: '4px 8px', fontSize: 13, outline: 'none', fontFamily: 'inherit', transition: 'all .2s' };

  const fieldR = (label: string, field: string, value: string | number, type = 'text') => (
    <div style={{ display: 'flex', alignItems: 'flex-start', padding: '7px 0', borderBottom: '1px solid var(--border-subtle)', gap: 10 }}>
      <span style={{ width: 105, flexShrink: 0, color: 'var(--text-subtle)', fontSize: 13, paddingTop: 3 }}>{label}</span>
      {ef === field ? (
        <div style={{ display: 'flex', gap: 6, flex: 1, alignItems: 'center' }}>
          {type === 'sp' ? <select value={ev} onChange={e => setEv(e.target.value)} style={ips}>{PRIORITIES.map(p => <option key={p}>{p}</option>)}</select>
            : type === 'sm' ? <select value={ev} onChange={e => setEv(e.target.value)} style={ips}>{MEMBERS.map(m => <option key={m}>{m}</option>)}</select>
              : type === 'ta' ? <textarea value={ev} onChange={e => setEv(e.target.value)} rows={3} style={{ ...ips, flex: 1, resize: 'vertical' }} autoFocus />
                : type === 'number' ? <input type="number" value={ev} onChange={e => setEv(e.target.value)} style={{ ...ips, width: 80 }} autoFocus />
                  : type === 'date' ? <DatePicker value={ev} onChange={v => setEv(v)} style={{ flex: 1 }} />
                    : <input type={type} value={ev} onChange={e => setEv(e.target.value)} style={{ ...ips, flex: 1 }} autoFocus />}
          <button onClick={() => saveE(field)} style={{ background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 3, padding: '4px 12px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Save</button>
          <button onClick={() => setEf(null)} style={{ background: 'var(--border)', color: 'var(--text-dim)', border: 'none', borderRadius: 3, padding: '4px 10px', fontSize: 13, cursor: 'pointer' }}>✕</button>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', minHeight: 20 }} onClick={() => startE(field, value)}>
          {field === 'priority' ? <span style={{ color: PC[value as string], fontSize: 14, fontWeight: 600 }}>{value}</span>
            : field === 'assignee' ? <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Av name={value as string} size={20} /><span style={{ color: 'var(--text-dim)', fontSize: 14 }}>{value}</span></div>
              : <span style={{ color: 'var(--text-dim)', fontSize: 14 }}>{value || '—'}</span>}
          <span style={{ marginLeft: 'auto', opacity: .2 }}><I.Edit /></span>
        </div>
      )}
    </div>
  );

  const timeAgo = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "y ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "mo ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "m ago";
    return "just now";
  };

  const renderComment = (text: string) => {
    const mentionRegex = /(@\w+)/g;
    const processInlines = (t: string) => {
      let parts: (string | React.ReactNode)[] = [t];
      parts = parts.flatMap(p => typeof p === 'string' ? p.split(mentionRegex).map((sub, i) => 
        sub.startsWith('@') ? <span key={i} style={{ color: MC[sub.slice(1)] || 'var(--accent)', fontWeight: 600 }}>{sub}</span> : sub
      ) : p);
      parts = parts.flatMap(p => typeof p === 'string' ? p.split(/(\*\*.*?\*\*)/g).map((sub, i) => 
        sub.startsWith('**') && sub.endsWith('**') ? <strong key={i} style={{ color: 'var(--text-main)' }}>{sub.slice(2, -2)}</strong> : sub
      ) : p);
      parts = parts.flatMap(p => typeof p === 'string' ? p.split(/(\*.*?\*)/g).map((sub, j) => 
        sub.startsWith('*') && !sub.startsWith('**') && sub.endsWith('*') ? <em key={j}>{sub.slice(1, -1)}</em> : sub
      ) : p);
      return parts;
    };

    // Code blocks
    const blocks = text.split(/(```[\s\S]*?```)/g);
    return blocks.map((b, i) => {
      if (b.startsWith('```') && b.endsWith('```')) {
        return <pre key={i} style={{ background: 'var(--bg)', padding: '10px 14px', borderRadius: 6, fontSize: 13, fontFamily: 'monospace', color: 'var(--text-dim)', overflowX: 'auto', margin: '8px 0', border: '1px solid var(--border)', lineHeight: 1.5 }}>{b.slice(3, -3).trim()}</pre>;
      }
      
      // Images & Links
      const mediaBlocks = b.split(/(!\[.*?\]\(.*?\)|\[.*?\]\(.*?\))/g);
      return mediaBlocks.map((mb, mi) => {
        const imgMatch = mb.match(/!\[(.*?)\]\((.*?)\)/);
        if (imgMatch) return <img key={mi} src={imgMatch[2]} alt={imgMatch[1]} style={{ maxWidth: '100%', borderRadius: 6, marginTop: 8, display: 'block', border: '1px solid var(--border)', boxShadow: '0 4px 12px rgba(0,0,0,.15)' }} />;
        const linkMatch = mb.match(/\[(.*?)\]\((.*?)\)/);
        if (linkMatch) return <a key={mi} href={linkMatch[2]} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', textDecoration: 'underline', fontWeight: 500 }}>{linkMatch[1]}</a>;
        
        // Lists
        const lines = mb.split('\n');
        return lines.map((l, li) => {
          if (l.trim().startsWith('- ')) {
            return <div key={li} style={{ display: 'flex', gap: 8, paddingLeft: 8, margin: '2px 0' }}>
              <span style={{ color: 'var(--accent)' }}>•</span>
              <span style={{ flex: 1 }}>{processInlines(l.trim().slice(2))}</span>
            </div>;
          }
          return <div key={li}>{processInlines(l)}</div>;
        });
      });
    });
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)', zIndex: 5000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(3px)' }}>
      <style>{`
        input[type="date"]::-webkit-calendar-picker-indicator { display: none; }
        .date-input-wrap:focus-within {
          border-color: var(--accent) !important;
          box-shadow: 0 0 0 2px var(--accent)33;
        }
        .no-arrows::-webkit-inner-spin-button, .no-arrows::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        .no-arrows { -moz-appearance: textfield; }
        
        [data-tooltip] { position: relative; cursor: help; }
        [data-tooltip]:after {
          content: attr(data-tooltip);
          position: absolute; bottom: 125%; left: 50%; transform: translateX(-50%);
          background: var(--popover-bg); color: var(--text-main); border: 1px solid var(--border);
          padding: 6px 12px; border-radius: 8px; font-size: 11px; font-weight: 600;
          white-space: nowrap; visibility: hidden; opacity: 0; transition: all 0.15s ease-out;
          box-shadow: 0 8px 24px rgba(0,0,0,0.2); z-index: 20000;
          pointer-events: none;
        }
        [data-tooltip]:hover:after { visibility: visible; opacity: 1; bottom: 115%; }
      `}</style>
      <div ref={ref} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10, width: 720, height: 640, display: 'flex', flexDirection: 'column', boxShadow: '0 24px 64px rgba(0,0,0,.45)', animation: 'slideIn .2s ease-out' }}>
        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ color: '#fff', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', background: PC[task.priority], padding: '4px 10px', borderRadius: 4 }}>{task.priority}</span>
          <span style={{ color: 'var(--text-main)', fontSize: 18, fontWeight: 700, flex: 1, letterSpacing: '-0.01em' }}>{task.title}</span>
          <button 
            onClick={() => setConfirm({ title: 'Delete Task?', msg: 'Are you sure you want to delete this task? This cannot be undone.', onConfirm: () => { onDelete(task.id); onClose(); toast('Task deleted', '#f44747'); } })} 
            style={{ background: 'color-mix(in srgb, var(--prio-critical), transparent 90%)', border: '1px solid var(--prio-critical)', color: 'var(--prio-critical)', cursor: 'pointer', padding: '8px', borderRadius: 8, display: 'flex', transition: 'all .2s' }} 
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--prio-critical)'; e.currentTarget.style.color = '#fff'; }} 
            onMouseLeave={e => { e.currentTarget.style.background = 'color-mix(in srgb, var(--prio-critical), transparent 90%)'; e.currentTarget.style.color = 'var(--prio-critical)'; }}
            data-tooltip="Delete Task"
          >
            <I.Trash s={18} />
          </button>
          <button onClick={onClose} style={{ background: 'var(--bg-alt)', border: '1px solid var(--border)', color: 'var(--text-main)', cursor: 'pointer', padding: '8px', borderRadius: 8, display: 'flex', transition: 'all .2s' }} onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'} onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
            <I.X s={18} />
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-subtle)', padding: '0 20px' }}>
          {(["details", "subtasks", "dependencies", "comments", "activity"] as TabKey[]).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ padding: '9px 14px', background: 'none', border: 'none', borderBottom: tab === t ? '2px solid var(--accent)' : '2px solid transparent', color: tab === t ? 'var(--text-main)' : 'var(--text-dim)', fontSize: 13, fontWeight: 500, cursor: 'pointer', textTransform: 'capitalize', marginBottom: -1 }}>
              {t}{t === 'comments' ? ` (${(task.comments || []).length})` : t === 'subtasks' ? ` (${(task.subtasks || []).filter(s => s.done).length}/${(task.subtasks || []).length})` : t === 'dependencies' ? ` (${(task.dependencies || []).length})` : ''}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ padding: '14px 20px', overflowY: 'auto', flex: 1 }}>
          {tab === 'details' && <div>
            <div style={{ padding: '7px 0', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <span style={{ width: 105, flexShrink: 0, color: 'var(--text-subtle)', fontSize: 13 }}>Current Status</span>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => onUpdate(task.id, { status: 'todo', ganttStart: undefined, ganttEnd: undefined, completedDate: undefined })} style={{ padding: '4px 12px', borderRadius: 4, cursor: 'pointer', fontSize: 12, fontWeight: 700, border: '1px solid var(--border)', background: task.status === 'todo' ? 'color-mix(in srgb, var(--text-main), transparent 95%)' : 'var(--bg-alt)', color: task.status === 'todo' ? 'var(--text-main)' : 'var(--text-subtle)', borderColor: task.status === 'todo' ? 'var(--text-main)' : 'var(--border)' }}>TO DO</button>
                <button onClick={() => onUpdate(task.id, { status: 'inprogress', ganttStart: task.ganttStart || fmt(today), ganttEnd: task.ganttEnd || fmt(addD(today, 5)), deadline: task.deadline || fmt(addD(today, 5)), completedDate: undefined })} style={{ padding: '4px 12px', borderRadius: 4, cursor: 'pointer', fontSize: 12, fontWeight: 700, border: '1px solid var(--border)', background: task.status === 'inprogress' ? 'color-mix(in srgb, var(--accent), transparent 85%)' : 'var(--bg-alt)', color: task.status === 'inprogress' ? 'var(--accent)' : 'var(--text-subtle)', borderColor: task.status === 'inprogress' ? 'var(--accent)' : 'var(--border)' }}>IN PROGRESS</button>
                <button onClick={() => onUpdate(task.id, { status: 'completed', completedDate: fmt(today), progress: 100 })} style={{ padding: '4px 12px', borderRadius: 4, cursor: 'pointer', fontSize: 12, fontWeight: 700, border: '1px solid var(--border)', background: task.status === 'completed' ? 'color-mix(in srgb, #4ec9b0, transparent 85%)' : 'var(--bg-alt)', color: task.status === 'completed' ? '#4ec9b0' : 'var(--text-subtle)', borderColor: task.status === 'completed' ? '#4ec9b0' : 'var(--border)' }}>COMPLETED</button>
              </div>
            </div>
            {fieldR('Title', 'title', task.title)}
            {fieldR('Description', 'desc', task.desc, 'ta')}
            {fieldR('Assignee', 'assignee', task.assignee, 'sm')}
            {fieldR('Priority', 'priority', task.priority, 'sp')}
            
            <div style={{ display: 'flex', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid var(--border-subtle)', gap: 10 }}>
              <span style={{ width: 105, flexShrink: 0, color: 'var(--text-subtle)', fontSize: 13 }}>Work Log</span>
              <div style={{ display: 'flex', gap: 10, flex: 1 }}>
                <div style={{ flex: 1, padding: '10px 14px', borderRadius: 8, background: 'var(--bg-alt)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <I.Code s={18} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 10, color: 'var(--text-subtle)', fontWeight: 800 }}>ESTIMATED</div>
                    {ef === 'estHours' ? (
                      <input autoFocus value={ev} onChange={e => setEv(e.target.value)} onBlur={() => saveE('estHours')} onKeyDown={e => e.key === 'Enter' && saveE('estHours')} style={{ width: '100%', background: 'transparent', border: 'none', borderBottom: '1px solid var(--accent)', color: 'var(--text-main)', fontSize: 13, outline: 'none', padding: '2px 0' }} />
                    ) : (
                      <div onClick={() => startE('estHours', task.estHours)} style={{ fontSize: 13, color: 'var(--text-main)', cursor: 'pointer', fontWeight: 600 }}>{task.estHours || 0}h</div>
                    )}
                  </div>
                </div>
                <div style={{ flex: 1, padding: '10px 14px', borderRadius: 8, background: 'var(--bg-alt)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <I.Cal s={18} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 10, color: 'var(--text-subtle)', fontWeight: 800 }}>ACTUAL HOURS</div>
                    {ef === 'actualHours' ? (
                      <input autoFocus value={ev} onChange={e => setEv(e.target.value)} onBlur={() => saveE('actualHours')} onKeyDown={e => e.key === 'Enter' && saveE('actualHours')} style={{ width: '100%', background: 'transparent', border: 'none', borderBottom: '1px solid var(--accent)', color: 'var(--text-main)', fontSize: 13, outline: 'none', padding: '2px 0' }} />
                    ) : (
                      <div onClick={() => startE('actualHours', task.actualHours)} style={{ fontSize: 13, color: 'var(--text-main)', cursor: 'pointer', fontWeight: 600 }}>{(task.actualHours || 0)}h</div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {fieldR('Deadline', 'deadline', task.deadline, 'date')}
            {task.status === 'inprogress' && fieldR('Start Date', 'ganttStart', task.ganttStart || '', 'date')}
            <div style={{ padding: '7px 0', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <span style={{ width: 105, flexShrink: 0, color: 'var(--text-subtle)', fontSize: 13 }}>Tags</span>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>{TAGS.map(t => {
                const isSel = (task.tags || []).includes(t);
                return <button key={t} onClick={() => { const c = task.tags || []; onUpdate(task.id, { tags: c.includes(t) ? c.filter(x => x !== t) : [...c, t] }); }} style={{ background: isSel ? TC[t] : 'var(--hover)', color: isSel ? TCT[t] : 'var(--text-subtle)', border: '1px solid ' + (isSel ? 'transparent' : 'var(--border)'), fontSize: 12, padding: '3px 10px', borderRadius: 5, cursor: 'pointer', fontWeight: isSel ? 700 : 500 }}>{t}</button>
              })}</div>
            </div>

            <div style={{ padding: '7px 0', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ width: 105, flexShrink: 0, color: 'var(--text-subtle)', fontSize: 13 }}>Progress</span>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 12 }}>
                <input 
                  type="range" 
                  data-tooltip="Settings & Export"
                  min="0" 
                  max="100" 
                  value={task.progress || 0} 
                  onChange={e => onUpdate(task.id, { progress: +e.target.value })} 
                  style={{ 
                    flex: 1, 
                    accentColor: 'var(--accent)',
                    cursor: 'pointer'
                  }} 
                />
                <div style={{ position: 'relative', width: 60 }}>
                  <input 
                    type="number" 
                    min="0" 
                    max="100" 
                    value={task.progress || 0} 
                    onChange={e => onUpdate(task.id, { progress: Math.min(100, Math.max(0, +e.target.value)) })}
                    className="no-arrows"
                    style={{ 
                      width: '100%', 
                      background: 'var(--bg-alt)', 
                      border: '1px solid var(--border)', 
                      borderRadius: 4, 
                      padding: '2px 20px 2px 6px', 
                      fontSize: 12, 
                      color: 'var(--text-main)', 
                      outline: 'none',
                      textAlign: 'right',
                      appearance: 'none',
                      MozAppearance: 'textfield'
                    }} 
                  />
                  <span style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: 'var(--text-subtle)', pointerEvents: 'none' }}>%</span>
                </div>
              </div>
            </div>
            <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-subtle)', display: 'flex', gap: 12 }}>
              <span>Created: {task.created}</span>
              {task.completedDate && <span>Completed: {task.completedDate}</span>}
              <span>Status: <span style={{ color: 'var(--accent)', textTransform: 'capitalize' }}>{task.status === 'inprogress' ? 'In Progress' : task.status}</span></span>
            </div>
          </div>}

          {tab === 'subtasks' && <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 14, color: 'var(--text-subtle)' }}>Track progress with subtasks</span>
              <button onClick={() => setShowSubModal(true)} style={{ background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 3, padding: '4px 12px', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}><I.Plus />Add</button>
            </div>
            {(task.subtasks || []).length > 0 && <div style={{ height: 4, borderRadius: 2, background: 'var(--border)', marginBottom: 12 }}>
              <div style={{ width: `${task.progress || 0}%`, height: '100%', borderRadius: 2, background: MC[task.assignee], transition: 'width .3s' }} />
            </div>}
            {(task.subtasks || []).map(s => {
              const upDate = (f: 'ganttStart' | 'deadline', v: string) => {
                const subs = task.subtasks.map(st => st.id === s.id ? { ...st, [f]: v } : st);
                const u: Partial<Task> = { subtasks: subs };
                if (task.status === 'inprogress') {
                  if (f === 'ganttStart' && task.ganttStart && v < task.ganttStart) u.ganttStart = v;
                  if (f === 'deadline' && task.deadline && v > task.deadline) { u.deadline = v; u.ganttEnd = v; }
                }
                onUpdate(task.id, u);
              };
              return (
                <div 
                  key={s.id} 
                  draggable
                  onDragStart={() => setDraggedSubId(s.id)}
                  onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderTop = '2px solid var(--accent)'; }}
                  onDragLeave={e => e.currentTarget.style.borderTop = '1px solid var(--border)'}
                  onDrop={e => { 
                    e.preventDefault(); 
                    e.currentTarget.style.borderTop = '1px solid var(--border)';
                    if (draggedSubId && draggedSubId !== s.id) reorderSubs(draggedSubId, s.id);
                  }}
                  style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 14px', borderRadius: 8, background: 'var(--bg-alt)', border: '1px solid var(--border)', marginBottom: 8, transition: 'all .15s', cursor: 'grab' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '4px 0', cursor: 'grab', opacity: 0.3 }}>
                    <div style={{ width: 10, height: 2, background: 'currentColor' }} />
                    <div style={{ width: 10, height: 2, background: 'currentColor' }} />
                    <div style={{ width: 10, height: 2, background: 'currentColor' }} />
                  </div>
                  <div 
                    onClick={() => toggleSub(s.id)}
                    style={{ width: 18, height: 18, borderRadius: 4, border: `1.5px solid ${s.done ? MC[task.assignee] : 'var(--text-subtle)'}`, background: s.done ? MC[task.assignee] : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2, cursor: 'pointer', color: '#fff' }}>
                    {s.done && <I.Check s={12} />}
                  </div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0 }}>
                    <span 
                      onClick={() => toggleSub(s.id)}
                      style={{ fontSize: 14, color: s.done ? 'var(--text-subtle)' : 'var(--text-main)', textDecoration: s.done ? 'line-through' : 'none', cursor: 'pointer', fontWeight: 600, wordBreak: 'break-word' }}>
                      {s.title}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 }}>
                        <span style={{ fontSize: 9, color: 'var(--text-subtle)', fontWeight: 800, flexShrink: 0 }}>START</span>
                        <DatePicker value={s.ganttStart || ''} onChange={v => upDate('ganttStart', v)} style={{ height: 26, flex: 1, minWidth: 0 }} />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 }}>
                        <span style={{ fontSize: 9, color: 'var(--text-subtle)', fontWeight: 800, flexShrink: 0 }}>END</span>
                        <DatePicker value={s.deadline || ''} onChange={v => upDate('deadline', v)} style={{ height: 26, flex: 1, minWidth: 0 }} />
                      </div>
                    </div>
                  </div>
                  <button onClick={() => delSub(s.id)} style={{ background: 'none', border: 'none', color: 'var(--text-subtle)', cursor: 'pointer', padding: 4, borderRadius: 4, marginTop: 2 }} data-tooltip="Remove Subtask" onMouseEnter={e => e.currentTarget.style.color = '#f44747'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-subtle)'}><I.Trash s={12} /></button>
                </div>
              );
            })}
            {(task.subtasks || []).length === 0 && <p style={{ color: 'var(--text-subtle)', fontSize: 14, textAlign: 'center', padding: 20 }}>No subtasks. Click "Add" to break this task down.</p>}
          </div>}


          {tab === 'dependencies' && <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <p style={{ fontSize: 13, color: 'var(--text-subtle)', marginBottom: 12 }}>Select tasks that must be completed before this one:</p>

            <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
              {['all', 'todo', 'inprogress', 'completed'].map(s => (
                <button
                  key={s}
                  onClick={() => setDepStatus(s as any)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 4,
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: 'pointer',
                    textTransform: 'uppercase',
                    letterSpacing: '.02em',
                    border: '1px solid ' + (depStatus === s ? 'var(--accent)' : 'var(--border)'),
                    background: depStatus === s ? 'color-mix(in srgb, var(--accent), transparent 90%)' : 'var(--bg-alt)',
                    color: depStatus === s ? 'var(--accent)' : 'var(--text-dim)',
                    transition: 'all .15s'
                  }}
                >{s}</button>
              ))}
            </div>

            <div style={{ position: 'relative', marginBottom: 16 }}>
              <input
                value={depSearch}
                onChange={e => setDepSearch(e.target.value)}
                placeholder="Search tasks..."
                style={{ width: '100%', background: 'var(--bg-alt)', color: 'var(--text-main)', border: '1px solid var(--border)', borderRadius: 6, padding: '10px 12px 10px 36px', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
              />
              <div style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)', display: 'flex' }}><I.Search s={16} /></div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', paddingRight: 4 }}>
              {allTasks
                .filter(t => t.id !== task.id)
                .filter(t => t.title.toLowerCase().includes(depSearch.toLowerCase()))
                .filter(t => depStatus === 'all' || t.status === depStatus)
                .map(t => {
                  const isSel = (task.dependencies || []).includes(t.id);
                  return (
                    <div key={t.id} onClick={() => toggleDep(t.id)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 8, cursor: 'pointer', marginBottom: 6, background: isSel ? 'color-mix(in srgb, var(--accent), transparent 90%)' : 'var(--bg-alt)', border: `1px solid ${isSel ? 'var(--accent)' : 'var(--border)'}`, transition: 'all .15s' }}>
                      <div style={{ width: 18, height: 18, borderRadius: 4, border: `1.5px solid ${isSel ? 'var(--accent)' : 'var(--text-subtle)'}`, background: isSel ? 'var(--accent)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#fff' }}>
                        {isSel && <I.Check s={12} />}
                      </div>
                      <Av name={t.assignee} size={24} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, color: 'var(--text-main)', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.title}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-subtle)' }}>{t.assignee} • <span style={{ textTransform: 'capitalize' }}>{t.status}</span></div>
                      </div>
                      <span style={{ fontSize: 10, color: PC[t.priority], fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.05em', background: `color-mix(in srgb, ${PC[t.priority]}, transparent 90%)`, padding: '2px 6px', borderRadius: 4 }}>{t.priority}</span>
                    </div>
                  );
              })}
              {allTasks.filter(t => t.id !== task.id && t.title.toLowerCase().includes(depSearch.toLowerCase()) && (depStatus === 'all' || t.status === depStatus)).length === 0 && (
                <div style={{ textAlign: 'center', padding: 40, border: '1px dashed var(--border)', borderRadius: 8 }}>
                  <p style={{ color: 'var(--text-subtle)', fontSize: 14 }}>No matching tasks found</p>
                </div>
              )}
            </div>
          </div>}

          {tab === 'comments' && <div>
            {/* ── Premium Composer ── */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <Av name="Onur" size={32} />
                <div style={{ flex: 1, borderRadius: 8, border: '1.5px solid var(--border)', background: 'var(--bg-alt)', boxShadow: '0 2px 8px rgba(0,0,0,.06)', transition: 'border-color .2s, box-shadow .2s', overflow: 'hidden' }}
                  onFocus={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.boxShadow = '0 0 0 3px color-mix(in srgb, var(--accent), transparent 85%)'; }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,.06)'; }}
                >
                  <textarea ref={inputRef as any} value={ct} onChange={e => handleCommentInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); addComment(); } }} placeholder="Write a comment…" style={{ width: '100%', background: 'transparent', color: 'var(--text-dim)', border: 'none', padding: '12px 14px 8px', fontSize: 14, outline: 'none', fontFamily: 'inherit', resize: 'none', minHeight: 72, boxSizing: 'border-box', lineHeight: 1.6 }} />
                  <div style={{ display: 'flex', alignItems: 'center', padding: '4px 8px 6px', gap: 2, borderTop: '1px solid var(--border-subtle)' }}>
                    {[
                      { icon: <b style={{ fontSize: 13, fontWeight: 800, color: 'inherit', lineHeight: '16px' }}>B</b>, action: () => setCt(ct + '**bold**'), tip: 'Bold' },
                      { icon: <i style={{ fontSize: 13, fontStyle: 'italic', color: 'inherit', lineHeight: '16px' }}>I</i>, action: () => setCt(ct + '*italic*'), tip: 'Italic' },
                      { icon: <I.Code s={14} />, action: () => setCt(ct + '\n```\n\n```'), tip: 'Code' },
                      { icon: <I.List s={14} />, action: () => setCt(ct + '\n- '), tip: 'List' },
                      { icon: <I.Link s={13} />, action: () => { setInsertPopup('link'); setPopupUrl(''); setPopupText(''); }, tip: 'Link' },
                      { icon: <I.Img s={14} />, action: () => { setInsertPopup('image'); setPopupUrl(''); setPopupText(''); }, tip: 'Image' },
                    ].map((btn, bi) => (
                      <button key={bi} onClick={btn.action} data-tooltip={btn.tip} style={{ width: 28, height: 28, background: 'none', border: 'none', borderRadius: 4, color: 'var(--text-subtle)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background .15s, color .15s' }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'var(--hover)'; e.currentTarget.style.color = 'var(--text-main)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-subtle)'; }}
                      >{btn.icon}</button>
                    ))}
                    <div style={{ width: 1, height: 16, background: 'var(--border)', margin: '0 4px' }} />
                    <span style={{ fontSize: 10, color: 'var(--text-subtle)', opacity: .5, flex: 1 }}><I.Kbd>⇧ Enter</I.Kbd> new line</span>
                    <button onClick={addComment} disabled={!ct.trim()} style={{ background: ct.trim() ? 'var(--accent)' : 'var(--border)', border: 'none', borderRadius: 6, padding: '5px 16px', cursor: ct.trim() ? 'pointer' : 'default', color: '#fff', fontSize: 12, fontWeight: 700, transition: 'background .2s, transform .1s', letterSpacing: '.02em' }}>Comment</button>
                  </div>
                  {showMentions && !editingId && <div style={{ position: 'relative' }}><div style={{ position: 'absolute', bottom: 0, left: 8, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, padding: 4, zIndex: 120, boxShadow: '0 -8px 24px rgba(0,0,0,.2)', width: 190 }}>
                    <div style={{ padding: '4px 8px', fontSize: 10, color: 'var(--text-subtle)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em' }}>Members</div>
                    {MEMBERS.map(m => (
                      <button key={m} onClick={() => insertMention(m)} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '6px 8px', background: 'none', border: 'none', color: 'var(--text-dim)', fontSize: 13, cursor: 'pointer', borderRadius: 4, fontFamily: 'inherit', transition: 'background .1s' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--hover)')} onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                        <Av name={m} size={20} /><span style={{ fontWeight: 500 }}>{m}</span>
                      </button>
                    ))}
                  </div></div>}
                </div>
              </div>
            </div>

            {/* ── Insert Link/Image Popup ── */}
            {insertPopup && (
              <div style={{ position: 'fixed', inset: 0, zIndex: 6000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,.35)', backdropFilter: 'blur(2px)' }} onClick={() => setInsertPopup(null)}>
                <div onClick={e => e.stopPropagation()} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10, padding: 0, width: 380, boxShadow: '0 16px 48px rgba(0,0,0,.35)', animation: 'slideIn .15s ease-out', overflow: 'hidden' }}>
                  <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 6, background: 'color-mix(in srgb, var(--accent), transparent 88%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
                      {insertPopup === 'image' ? <I.Img s={14} /> : <I.Link s={13} />}
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-main)', flex: 1 }}>{insertPopup === 'image' ? 'Insert Image' : 'Insert Link'}</span>
                    <button onClick={() => setInsertPopup(null)} style={{ background: 'none', border: 'none', color: 'var(--text-subtle)', cursor: 'pointer', padding: 2 }}><I.X /></button>
                  </div>
                  <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {insertPopup === 'image' && (
                      <>
                        {/* Drag-Drop Zone */}
                        <div
                          onDragOver={e => { e.preventDefault(); setDraggingFile(true); }}
                          onDragLeave={() => setDraggingFile(false)}
                          onDrop={e => { e.preventDefault(); setDraggingFile(false); const f = e.dataTransfer.files[0]; if (f) handleFileUpload(f); }}
                          onClick={() => fileInputRef.current?.click()}
                          style={{ border: `2px dashed ${draggingFile ? 'var(--accent)' : 'var(--border)'}`, borderRadius: 8, padding: '20px 16px', textAlign: 'center', cursor: 'pointer', background: draggingFile ? 'color-mix(in srgb, var(--accent), transparent 95%)' : 'var(--bg-alt)', transition: 'all .2s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}
                        >
                          <div style={{ width: 36, height: 36, borderRadius: '50%', background: draggingFile ? 'color-mix(in srgb, var(--accent), transparent 85%)' : 'var(--hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: draggingFile ? 'var(--accent)' : 'var(--text-subtle)', transition: 'all .2s' }}><I.Img s={16} /></div>
                          <span style={{ fontSize: 13, color: draggingFile ? 'var(--accent)' : 'var(--text-dim)', fontWeight: 500 }}>{draggingFile ? 'Drop image here' : 'Drag & drop an image, or click to browse'}</span>
                          <span style={{ fontSize: 11, color: 'var(--text-subtle)', opacity: .6 }}>PNG, JPG, GIF, WebP • Max 5MB</span>
                        </div>
                        <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); e.target.value = ''; }} />
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                          <span style={{ fontSize: 11, color: 'var(--text-subtle)', fontWeight: 600 }}>OR</span>
                          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                        </div>
                      </>
                    )}
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-subtle)', display: 'block', marginBottom: 6 }}>{insertPopup === 'image' ? 'Image URL' : 'URL'}</label>
                      <input value={popupUrl.startsWith('data:') ? '✓ File uploaded' : popupUrl} onChange={e => setPopupUrl(e.target.value)} placeholder={insertPopup === 'image' ? 'https://example.com/photo.png' : 'https://example.com'} readOnly={popupUrl.startsWith('data:')} autoFocus={insertPopup === 'link'} style={{ width: '100%', background: popupUrl.startsWith('data:') ? 'color-mix(in srgb, var(--accent), transparent 92%)' : 'var(--bg-alt)', color: popupUrl.startsWith('data:') ? 'var(--accent)' : 'var(--text-dim)', border: `1.5px solid ${popupUrl.startsWith('data:') ? 'var(--accent)' : 'var(--border)'}`, borderRadius: 6, padding: '8px 12px', fontSize: 14, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', transition: 'border-color .2s', fontWeight: popupUrl.startsWith('data:') ? 600 : 400 }} onFocus={e => { if(!popupUrl.startsWith('data:')) e.currentTarget.style.borderColor = 'var(--accent)'; }} onBlur={e => { if(!popupUrl.startsWith('data:')) e.currentTarget.style.borderColor = 'var(--border)'; }} />
                      {popupUrl.startsWith('data:') && <button onClick={() => { setPopupUrl(''); setPopupText(''); }} style={{ background: 'none', border: 'none', color: 'var(--text-subtle)', fontSize: 11, cursor: 'pointer', marginTop: 4, padding: 0 }}>✕ Remove file</button>}
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-subtle)', display: 'block', marginBottom: 6 }}>{insertPopup === 'image' ? 'Alt text (optional)' : 'Display text (optional)'}</label>
                      <input value={popupText} onChange={e => setPopupText(e.target.value)} placeholder={insertPopup === 'image' ? 'Describe the image' : 'Click here'} style={{ width: '100%', background: 'var(--bg-alt)', color: 'var(--text-dim)', border: '1.5px solid var(--border)', borderRadius: 6, padding: '8px 12px', fontSize: 14, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', transition: 'border-color .2s' }} onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent)')} onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')} onKeyDown={e => { if (e.key === 'Enter' && popupUrl.trim()) { setCt(ct + (insertPopup === 'image' ? ` ![${popupText || 'img'}](${popupUrl})` : ` [${popupText || 'link'}](${popupUrl})`)); setInsertPopup(null); } }} />
                    </div>
                    {insertPopup === 'image' && popupUrl.trim() && (
                      <div style={{ borderRadius: 6, border: '1px solid var(--border)', overflow: 'hidden', background: 'var(--bg-alt)' }}>
                        <img src={popupUrl} alt="Preview" style={{ width: '100%', maxHeight: 140, objectFit: 'cover', display: 'block' }} onError={e => (e.currentTarget.style.display = 'none')} />
                      </div>
                    )}
                  </div>
                  <div style={{ padding: '10px 18px 14px', display: 'flex', gap: 8, justifyContent: 'flex-end', borderTop: '1px solid var(--border-subtle)' }}>
                    <button onClick={() => setInsertPopup(null)} style={{ background: 'none', color: 'var(--text-subtle)', border: '1px solid var(--border)', borderRadius: 6, padding: '6px 16px', fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>Cancel</button>
                    <button disabled={!popupUrl.trim()} onClick={() => { setCt(ct + (insertPopup === 'image' ? ` ![${popupText || 'img'}](${popupUrl})` : ` [${popupText || 'link'}](${popupUrl})`)); setInsertPopup(null); }} style={{ background: popupUrl.trim() ? 'var(--accent)' : 'var(--border)', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 16px', fontSize: 13, fontWeight: 700, cursor: popupUrl.trim() ? 'pointer' : 'default', transition: 'background .2s' }}>Insert</button>
                  </div>
                </div>
              </div>
            )}

            {/* ── Comment Cards ── */}
            {(task.comments || []).slice().reverse().map(c => (
              <div key={c.id} style={{ display: 'flex', gap: 12, padding: 14, marginBottom: 8, borderRadius: 8, background: 'var(--bg-alt)', border: '1px solid var(--border-subtle)', transition: 'border-color .2s, box-shadow .2s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,.06)'; const a = e.currentTarget.querySelector('[data-actions]') as HTMLElement; if(a) a.style.opacity = '1'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.boxShadow = 'none'; const a = e.currentTarget.querySelector('[data-actions]') as HTMLElement; if(a) a.style.opacity = '0'; }}
              >
                <Av name={c.author} size={32} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{ color: 'var(--text-main)', fontSize: 13, fontWeight: 700 }}>{c.author}</span>
                    <span style={{ color: 'var(--text-subtle)', fontSize: 11 }}>{timeAgo(c.ts)}</span>
                    {c.lastEdited && <span style={{ fontSize: 10, color: 'var(--accent)', background: 'color-mix(in srgb, var(--accent), transparent 90%)', padding: '1px 6px', borderRadius: 8, fontWeight: 600 }}>edited</span>}
                    <div data-actions style={{ marginLeft: 'auto', display: 'flex', gap: 4, opacity: 0, transition: 'opacity .15s' }}>
                      <button onClick={() => { setEditingId(c.id); setEditVal(c.text); }} style={{ width: 24, height: 24, background: 'var(--hover)', border: '1px solid var(--border-subtle)', borderRadius: 4, color: 'var(--text-subtle)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'color .15s' }}
                        onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent)')} onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-subtle)')} data-tooltip="Edit"><I.Edit /></button>
                      <button 
                        onClick={() => setConfirm({ 
                          title: 'Delete Comment?', 
                          msg: 'Are you sure you want to delete this comment?', 
                          onConfirm: () => { 
                            onUpdate(task.id, { comments: task.comments.filter(x => x.id !== c.id) }); 
                            setConfirm(null);
                            toast('Comment deleted'); 
                          } 
                        })} 
                        style={{ width: 24, height: 24, background: 'var(--hover)', border: '1px solid var(--border-subtle)', borderRadius: 4, color: 'var(--text-subtle)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'color .15s' }}
                        onMouseEnter={e => (e.currentTarget.style.color = '#f44747')} onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-subtle)')} data-tooltip="Delete"><I.Trash /></button>
                    </div>
                  </div>
                  {editingId === c.id ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, position: 'relative' }}>
                      <textarea value={editVal} onChange={e => handleCommentInput(e.target.value, true)} style={{ width: '100%', background: 'var(--bg)', color: 'var(--text-dim)', border: '1.5px solid var(--accent)', borderRadius: 6, padding: '10px 12px', fontSize: 14, outline: 'none', fontFamily: 'inherit', resize: 'none', minHeight: 60, boxSizing: 'border-box', boxShadow: '0 0 0 3px color-mix(in srgb, var(--accent), transparent 85%)' }} autoFocus />
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        <button onClick={() => setEditingId(null)} style={{ background: 'none', color: 'var(--text-subtle)', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 14px', fontSize: 12, cursor: 'pointer', fontWeight: 500 }}>Cancel</button>
                        <button onClick={() => editComment(c.id)} style={{ background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Save changes</button>
                      </div>
                      {showMentions && editingId === c.id && <div style={{ position: 'absolute', top: '100%', left: 0, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, padding: 4, zIndex: 110, boxShadow: '0 4px 16px rgba(0,0,0,.25)', marginTop: 4, width: 180 }}>
                        {MEMBERS.map(m => (
                          <button key={m} onClick={() => insertMention(m)} style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%', padding: '5px 8px', background: 'none', border: 'none', color: 'var(--text-dim)', fontSize: 12, cursor: 'pointer', borderRadius: 4 }}><Av name={m} size={18} />{m}</button>
                        ))}
                      </div>}
                    </div>
                  ) : (
                    <>
                      <div style={{ color: 'var(--text-dim)', fontSize: 14, lineHeight: 1.65, wordBreak: 'break-word' }}>{renderComment(c.text)}</div>
                      <div style={{ display: 'flex', gap: 4, marginTop: 10, flexWrap: 'wrap' }}>
                        {['👍', '🔥', '✅', '🚀', '❤️', '👀'].map(emoji => {
                          const count = (c.reactions || {})[emoji] || 0;
                          return (
                            <button key={emoji} onClick={() => toggleReact(c.id, emoji)} style={{ background: count > 0 ? 'color-mix(in srgb, var(--accent), transparent 88%)' : 'transparent', border: `1px solid ${count > 0 ? 'color-mix(in srgb, var(--accent), transparent 60%)' : 'var(--border-subtle)'}`, borderRadius: 16, padding: '3px 8px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', color: count > 0 ? 'var(--accent)' : 'var(--text-subtle)', transition: 'all .15s', opacity: count > 0 ? 1 : 0.4, fontWeight: count > 0 ? 700 : 400 }}
                              onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.12)'; e.currentTarget.style.opacity = '1'; e.currentTarget.style.borderColor = 'var(--border)'; }}
                              onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.opacity = count > 0 ? '1' : '0.4'; e.currentTarget.style.borderColor = count > 0 ? 'color-mix(in srgb, var(--accent), transparent 60%)' : 'var(--border-subtle)'; }}
                            ><span>{emoji}</span>{count > 0 && <span style={{ fontSize: 11 }}>{count}</span>}</button>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}

            {/* ── Empty State ── */}
            {(task.comments || []).length === 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 20px', gap: 12 }}>
                <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-subtle)', border: '1px dashed var(--border)' }}><I.Chat /></div>
                <span style={{ color: 'var(--text-dim)', fontSize: 14, fontWeight: 600 }}>No comments yet</span>
                <span style={{ color: 'var(--text-subtle)', fontSize: 12, maxWidth: 260, textAlign: 'center', lineHeight: 1.5 }}>Start the conversation — support <strong>**bold**</strong>, <em>*italic*</em>, @mentions, code blocks, and more.</span>
              </div>
            )}
          </div>}

          {tab === 'activity' && <div style={{ color: 'var(--text-dim)', fontSize: 14 }}>
            {[
              { dot: 'var(--accent)', text: `Task created on ${task.created}` },
              ...(task.status === 'inprogress' ? [{ dot: 'var(--prio-medium)', text: `Moved to In Progress — started ${task.ganttStart}` }] : []),
              ...(task.status === 'completed' ? [{ dot: 'var(--accent-purple)', text: `Completed on ${task.completedDate}` }] : []),
              ...(task.dependencies || []).map(dId => { const dt = allTasks.find(t => t.id === dId); return { dot: 'var(--accent)', text: `Depends on: ${dt?.title || dId}` }; }),
              ...(task.comments || []).map(c => ({ dot: MC[c.author] || 'var(--text-subtle)', text: `${c.author} commented — ${new Date(c.ts).toLocaleString()}` })),
            ].map((e, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: e.dot, flexShrink: 0 }} />
                <span>{e.text}</span>
              </div>
            ))}
          </div>}
        </div>
      </div>
      {showSubModal && <SubtaskModal onAdd={addSub} onCancel={() => setShowSubModal(false)} />}
      {confirm && <ConfirmDialog title={confirm.title} message={confirm.msg} onConfirm={confirm.onConfirm} onCancel={() => setConfirm(null)} />}
    </div>
  );
};
