import { useState, useMemo, useRef, Fragment } from "react";
import type { Task } from "./types.ts";
import { MEMBERS, PRIORITIES, MC, PC, TC, fmt, today, addD, parse } from "./constants.ts";
import { I, Av } from "./Icons.tsx";
import { CtxMenu } from "./CtxMenu.tsx";

interface Props {
  title: string;
  status: Task["status"];
  tasks: Task[];
  color: string;
  collapsed: boolean;
  onToggle: () => void;
  onTaskClick: (task: Task) => void;
  onUpdate: (id: string, u: Partial<Task>) => void;
  onDelete: (id: string) => void;
  searchFilter: string;
  memberFilter: string[];
  tagFilter: string[];
  priorityFilter: string[];
  onNewTask: (status: string) => void;
  toast: (msg: string, color?: string) => void;
}

interface CtxMenuState {
  x: number;
  y: number;
  task: Task;
}

export const CardCol = ({ title, status, tasks, color, collapsed, onToggle, onTaskClick, onUpdate, onDelete, searchFilter, memberFilter, tagFilter, priorityFilter, onNewTask, toast: addToast }: Props) => {
  const [ctxMenu, setCtxMenu] = useState<CtxMenuState | null>(null);
  const [hoveredTask, setHoveredTask] = useState<string | null>(null);
  const [isOver, setIsOver] = useState(false);
  const dragCounter = useRef(0);

  const fTasks = useMemo(() => tasks.filter(t => {
    if (t.status !== status) return false;
    if (searchFilter && !t.title.toLowerCase().includes(searchFilter.toLowerCase())) return false;
    if (memberFilter.length > 0 && !memberFilter.includes(t.assignee)) return false;
    if (tagFilter.length > 0 && !tagFilter.some(tf => (t.tags || []).includes(tf))) return false;
    if (priorityFilter.length > 0 && !priorityFilter.includes(t.priority)) return false;
    return true;
  }).sort((a, b) => {
    const pi = PRIORITIES.indexOf(a.priority as typeof PRIORITIES[number]) - PRIORITIES.indexOf(b.priority as typeof PRIORITIES[number]);
    return pi !== 0 ? pi : (a.deadline || '').localeCompare(b.deadline || '');
  }), [tasks, status, searchFilter, memberFilter, tagFilter, priorityFilter]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsOver(false);
    dragCounter.current = 0;
    const tid = e.dataTransfer.getData('tid');
    if (!tid) return;
    const u: Partial<Task> = { status };
    if (status === 'completed') { u.completedDate = fmt(today); u.ganttStart = undefined; u.ganttEnd = undefined; u.progress = 100; }
    if (status === 'inprogress') { u.ganttStart = fmt(today); const d = fmt(addD(today, 5)); u.ganttEnd = d; u.deadline = d; }
    if (status === 'todo') { u.ganttStart = undefined; u.ganttEnd = undefined; u.completedDate = undefined; }
    onUpdate(tid, u);
    addToast(`Task moved to ${title}`, '#007acc');
  };

  const handleCtx = (e: React.MouseEvent, task: Task) => {
    e.preventDefault();
    setCtxMenu({ x: e.clientX, y: e.clientY, task });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minWidth: collapsed ? 44 : 'auto', width: collapsed ? 44 : 290, transition: 'width .25s ease', flexShrink: 0, borderRight: '2px solid #3c3c3c', background: color ? color + '0a' : '#1e1e1e', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: collapsed ? '12px 8px' : '12px 14px', borderBottom: '1px solid #2d2d2d', cursor: 'pointer', background: '#252526', flexShrink: 0, height: 48, boxSizing: 'border-box' }} onClick={onToggle}>
        {collapsed ? <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, width: '100%' }}>
          <I.Chev open={false} s={12} />
          <div style={{ writingMode: 'vertical-rl', textOrientation: 'mixed', fontSize: 13, fontWeight: 600, color, letterSpacing: '.03em' }}>{title}</div>
          <div style={{ background: color + '22', color, fontSize: 12, fontWeight: 700, padding: '2px 6px', borderRadius: 8 }}>{fTasks.length}</div>
        </div> : <Fragment>
          <I.Chev open={true} s={12} />
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
          <span style={{ fontSize: 14, fontWeight: 600, color: '#d4d4d4', flex: 1 }}>{title}</span>
          <span style={{ fontSize: 13, color: '#888', background: '#2d2d2d', padding: '1px 8px', borderRadius: 8, fontWeight: 600 }}>{fTasks.length}</span>
          <button onClick={e => { e.stopPropagation(); onNewTask(status); }} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', padding: 2 }}><I.Plus /></button>
        </Fragment>}
      </div>

      {!collapsed && <div style={{ flex: 1, overflowY: 'auto', padding: 8, display: 'flex', flexDirection: 'column', gap: 6, transition: 'background 0.2s', border: isOver ? `2px dashed ${color}` : '2px dashed transparent', margin: '0 2px 2px 2px', borderRadius: 8, background: isOver ? color + '15' : 'transparent', position: 'relative' }} 
        onDragOver={e => e.preventDefault()} 
        onDragEnter={(e) => { e.preventDefault(); dragCounter.current++; setIsOver(true); }}
        onDragLeave={() => { dragCounter.current--; if (dragCounter.current === 0) setIsOver(false); }}
        onDrop={handleDrop}>
        {isOver && <div style={{ position: 'absolute', inset: 0, zIndex: 100, pointerEvents: 'none' }} />}
        {fTasks.map(task => (
          <div key={task.id} draggable onDragStart={e => e.dataTransfer.setData('tid', task.id)} onClick={() => onTaskClick(task)} onContextMenu={e => handleCtx(e, task)}
            style={{ position: 'relative', background: '#252526', borderRadius: 6, padding: '10px 12px', cursor: 'pointer', border: '1px solid #444', transition: 'border-color .15s,transform .15s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#007accbb'; e.currentTarget.style.transform = 'translateY(-1px)'; setHoveredTask(task.id); }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#444'; e.currentTarget.style.transform = 'none'; setHoveredTask(null); }}>
            
            {hoveredTask === task.id && (
              <button 
                onClick={e => { e.stopPropagation(); if (confirm('Delete this task?')) onDelete(task.id); }}
                style={{ position: 'absolute', top: 6, right: 6, background: '#f4474722', border: 'none', color: '#f44747', padding: 4, borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}
                title="Delete Task"
                onMouseEnter={e => { e.currentTarget.style.background = '#f44747'; e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#f4474722'; e.currentTarget.style.color = '#f44747'; }}
              >
                <I.Trash />
              </button>
            )}
            {(task.tags || []).length > 0 && <div style={{ display: 'flex', gap: 3, marginBottom: 6, flexWrap: 'wrap' }}>
              {task.tags.map(t => <span key={t} style={{ background: TC[t] || '#333', color: '#bbb', fontSize: 11, padding: '1px 6px', borderRadius: 3, fontWeight: 500 }}>{t}</span>)}
            </div>}
            <div style={{ color: '#d4d4d4', fontSize: 14, fontWeight: 500, lineHeight: 1.4, marginBottom: 6 }}>{task.title}</div>
            
            {(task.subtasks || []).length > 0 && <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 8, paddingLeft: 4 }}>
              {task.subtasks.map(s => (
                <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '2px 0' }} onClick={e => e.stopPropagation()}>
                  <div 
                    onClick={() => {
                      const subs = task.subtasks.map(st => st.id === s.id ? { ...st, done: !st.done } : st);
                      const doneCount = subs.filter(st => st.done).length;
                      const progress = Math.round(doneCount / subs.length * 100);
                      onUpdate(task.id, { subtasks: subs, progress });
                    }}
                    style={{ 
                      width: 14, height: 14, borderRadius: 3, 
                      border: `1.2px solid ${s.done ? MC[task.assignee] || '#007acc' : '#555'}`, 
                      background: s.done ? (MC[task.assignee] || '#007acc') + '22' : 'transparent', 
                      display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 
                    }}
                  >
                    {s.done && <I.Check />}
                  </div>
                  <span style={{ fontSize: 12, color: s.done ? '#666' : '#aaa', textDecoration: s.done ? 'line-through' : 'none', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.title}</span>
                </div>
              ))}
            </div>}

            {task.subtasks?.length > 0 && <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <div style={{ flex: 1, height: 3, borderRadius: 2, background: '#333' }}>
                <div style={{ width: `${task.progress || 0}%`, height: '100%', borderRadius: 2, background: MC[task.assignee] || '#007acc', transition: 'width .2s' }} />
              </div>
              <span style={{ fontSize: 11, color: '#888' }}>{task.subtasks.filter(s => s.done).length}/{task.subtasks.length}</span>
            </div>}
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: PC[task.priority], textTransform: 'uppercase', letterSpacing: '.05em' }}>{task.priority}</span>
              {task.estHours && <span style={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: 12, color: '#666' }}><I.Clock />{task.estHours}h</span>}
              {task.deadline && <span style={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: 12, color: task.status !== 'completed' && parse(task.deadline)! < today ? '#f44747' : '#666' }}><I.Cal />{task.deadline.slice(5)}</span>}
              {task.comments?.length > 0 && <span style={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: 12, color: '#666' }}><I.Chat />{task.comments.length}</span>}
              {(task.dependencies || []).length > 0 && <span style={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: 12, color: '#c586c0' }}><I.Link />{task.dependencies.length}</span>}
              <div style={{ marginLeft: 'auto' }}><Av name={task.assignee} size={22} /></div>
            </div>

            {hoveredTask === task.id && (
              <div style={{ marginTop: 10, paddingTop: 8, borderTop: '1px solid #333', display: 'flex', gap: 6 }}>
                {status === 'todo' && <button onClick={e => { e.stopPropagation(); onUpdate(task.id, { status: 'inprogress', ganttStart: fmt(today), ganttEnd: fmt(addD(today, 5)) }); addToast('Task Started'); }} style={{ flex: 1, background: '#007acc22', border: '1px solid #007acc44', borderRadius: 4, color: '#007acc', fontSize: 11, fontWeight: 700, padding: '4px 0', cursor: 'pointer' }}>START</button>}
                {status === 'inprogress' && <button onClick={e => { e.stopPropagation(); onUpdate(task.id, { status: 'completed', completedDate: fmt(today), progress: 100 }); addToast('Completed!', '#4ec9b0'); }} style={{ flex: 1, background: '#4ec9b022', border: '1px solid #4ec9b044', borderRadius: 4, color: '#4ec9b0', fontSize: 11, fontWeight: 700, padding: '4px 0', cursor: 'pointer' }}>COMPLETE</button>}
                {status === 'completed' && <button onClick={e => { e.stopPropagation(); onUpdate(task.id, { status: 'todo', completedDate: undefined }); addToast('Reopened'); }} style={{ flex: 1, background: '#dcdcaa22', border: '1px solid #dcdcaa44', borderRadius: 4, color: '#dcdcaa', fontSize: 11, fontWeight: 700, padding: '4px 0', cursor: 'pointer' }}>REOPEN</button>}
              </div>
            )}
          </div>
        ))}
      </div>}

      {ctxMenu && <CtxMenu x={ctxMenu.x} y={ctxMenu.y} onClose={() => setCtxMenu(null)} items={[
        { label: 'Open Details', icon: <I.Edit />, action: () => onTaskClick(ctxMenu.task) },
        { label: 'Move to To Do', action: () => { onUpdate(ctxMenu.task.id, { status: 'todo', ganttStart: undefined, ganttEnd: undefined, completedDate: undefined }); addToast('Moved to To Do'); } },
        { label: 'Move to In Progress', action: () => { const d = fmt(addD(today, 5)); onUpdate(ctxMenu.task.id, { status: 'inprogress', ganttStart: fmt(today), ganttEnd: d, deadline: d, completedDate: undefined }); addToast('Moved to In Progress'); } },
        { label: 'Move to Completed', icon: <I.Check />, action: () => { onUpdate(ctxMenu.task.id, { status: 'completed', completedDate: fmt(today), progress: 100 }); addToast('Completed!', '#4ec9b0'); } },
        { divider: true },
        ...PRIORITIES.map(p => ({ label: `Priority: ${p}`, icon: <span style={{ color: PC[p] }}>●</span>, action: () => onUpdate(ctxMenu.task.id, { priority: p }) })),
        { divider: true },
        { label: 'Delete Task', icon: <I.Trash />, danger: true, action: () => { /* handled by parent */ } },
      ]} />}
    </div>
  );
};
