import { useState, useMemo, useRef, Fragment } from "react";
import type { Task } from "./types.ts";
import { PRIORITIES, MC, PC, TC, TCT, fmt, today, addD, parse, isTaskBlocked } from "./constants.ts";
import { I, Av } from "./Icons.tsx";
import { CtxMenu } from "./CtxMenu.tsx";
import { ConfirmDialog } from "./ConfirmDialog.tsx";

interface Props {
  title: string;
  status: Task["status"];
  tasks: Task[];
  color: string;
  collapsed: boolean;
  onToggle: () => void;
  onTaskClick: (task: Task) => void;
  onUpdate: (id: string, u: Partial<Task>, skipHistory?: boolean) => void;
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
  const [confirm, setConfirm] = useState<{ title: string, msg: string, onConfirm: () => void } | null>(null);
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
    <div style={{ display: 'flex', flexDirection: 'column', minWidth: collapsed ? 48 : 'auto', width: collapsed ? 48 : 290, transition: 'width .25s cubic-bezier(0.4, 0, 0.2, 1)', flexShrink: 0, borderRight: '2px solid var(--border)', borderLeft: collapsed ? `3px solid ${color}` : 'none', background: color ? color + '05' : 'var(--bg)', overflow: 'hidden' }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 10, 
        padding: collapsed ? '16px 0' : '14px 18px', 
        borderBottom: collapsed ? 'none' : '1px solid var(--border-subtle)', 
        cursor: 'pointer', 
        background: 'rgba(var(--bg-alt-rgb), 0.4)', 
        backdropFilter: 'blur(10px)',
        flexShrink: collapsed ? 1 : 0, 
        flex: collapsed ? 1 : 'none',
        height: collapsed ? 'auto' : 52, 
        boxSizing: 'border-box',
        transition: 'all .25s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative'
      }} onClick={onToggle}>
        {collapsed ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', height: '100%', position: 'relative', animation: 'fadeIn .3s ease' }}>
            {/* Accent top bar */}
            <div style={{ width: 24, height: 3, borderRadius: 2, background: color, opacity: .7, marginBottom: 12, flexShrink: 0 }} />
            {/* Vertical title */}
            <div style={{ 
              flex: 1, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              overflow: 'hidden'
            }}>
              <span style={{ 
                writingMode: 'vertical-lr', 
                transform: 'rotate(180deg)',
                fontSize: 11, 
                fontWeight: 700, 
                color: 'var(--text-dim)', 
                letterSpacing: '.12em',
                textTransform: 'uppercase',
                whiteSpace: 'nowrap'
              }}>{title}</span>
            </div>
            {/* Count badge */}
            <div style={{ 
              background: `color-mix(in srgb, ${color}, transparent 80%)`,
              color: color, 
              fontSize: 11, 
              fontWeight: 800, 
              width: 24,
              height: 24,
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: `1px solid color-mix(in srgb, ${color}, transparent 60%)`,
              flexShrink: 0,
              marginTop: 8
            }}>{fTasks.length}</div>
          </div>
        ) : (
          <Fragment>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
              <I.Chev open={true} s={12} />
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: color, boxShadow: `0 0 10px ${color}44` }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-main)', letterSpacing: '.02em', textTransform: 'uppercase' }}>{title}</span>
              <span style={{ 
                fontSize: 11, 
                color: 'var(--text-subtle)', 
                background: 'var(--hover)', 
                padding: '2px 8px', 
                borderRadius: 10, 
                fontWeight: 700,
                border: '1px solid var(--border-subtle)'
               }}>{fTasks.length}</span>
            </div>
            <button onClick={e => { e.stopPropagation(); onNewTask(status); }} style={{ background: 'var(--hover)', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: 6, borderRadius: 6, display: 'flex', transition: 'all .2s' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--border)'} onMouseLeave={e => e.currentTarget.style.background = 'var(--hover)'}><I.Plus s={14} /></button>
          </Fragment>
        )}
      </div>

      {!collapsed && <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: 8, display: 'flex', flexDirection: 'column', gap: 6, transition: 'background 0.2s', border: isOver ? `2px dashed ${color}` : '2px dashed transparent', margin: '0 2px 2px 2px', borderRadius: 8, background: isOver ? color + '15' : 'transparent', position: 'relative' }} 
        onDragOver={e => e.preventDefault()} 
        onDragEnter={(e) => { e.preventDefault(); dragCounter.current++; setIsOver(true); }}
        onDragLeave={() => { dragCounter.current--; if (dragCounter.current === 0) setIsOver(false); }}
        onDrop={handleDrop}>
        {isOver && <div style={{ position: 'absolute', inset: 0, zIndex: 100, pointerEvents: 'none' }} />}
        {fTasks.map(task => (
          <div key={task.id} draggable onDragStart={e => e.dataTransfer.setData('tid', task.id)} onClick={() => onTaskClick(task)} onContextMenu={e => handleCtx(e, task)}
            style={{ position: 'relative', background: 'var(--bg-card)', borderRadius: 6, padding: '10px 12px', cursor: 'pointer', border: '1px solid var(--border)', transition: 'border-color .15s,transform .15s', boxShadow: '0 2px 4px rgba(0,0,0,.05)' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.transform = 'translateY(-1px)'; setHoveredTask(task.id); }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none'; setHoveredTask(null); }}>
            
            {hoveredTask === task.id && (
              <button 
                onClick={e => { e.stopPropagation(); setConfirm({ title: 'Delete Task?', msg: 'Are you sure you want to delete this task?', onConfirm: () => { onDelete(task.id); setConfirm(null); addToast('Task deleted', '#f44747'); } }); }}
                style={{ position: 'absolute', top: 6, right: 6, background: '#f4474722', border: 'none', color: '#f44747', padding: 4, borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}
                data-tooltip="Delete Task"
                onMouseEnter={e => { e.currentTarget.style.background = '#f44747'; e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#f4474722'; e.currentTarget.style.color = '#f44747'; }}
              >
                <I.Trash />
              </button>
            )}
            {(task.tags || []).length > 0 && <div style={{ display: 'flex', gap: 3, marginBottom: 8, flexWrap: 'wrap' }}>
              {task.tags.map(t => <span key={t} style={{ background: TC[t] || 'var(--tag-bg)', color: TCT[t] || 'var(--text-dim)', fontSize: 10, padding: '2px 8px', borderRadius: 4, fontWeight: 700, letterSpacing: '.02em' }}>{t}</span>)}
            </div>}

            {(task.subtasks || []).length > 0 && <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 8, paddingLeft: 4 }}>
              {task.subtasks.map(s => {
                const toggleSub = () => {
                  const subs = task.subtasks.map(st => st.id === s.id ? { ...st, done: !st.done } : st);
                  const doneCount = subs.filter(st => st.done).length;
                  const progress = Math.round(doneCount / subs.length * 100);
                  onUpdate(task.id, { subtasks: subs, progress });
                };
                return (
                <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '2px 0' }} onClick={e => e.stopPropagation()}>
                  <div
                    onClick={toggleSub}
                    style={{
                      width: 14, height: 14, borderRadius: 3,
                      border: `1.2px solid ${s.done ? MC[task.assignee] || 'var(--accent)' : 'var(--text-subtle)'}`,
                      background: s.done ? `color-mix(in srgb, ${MC[task.assignee] || 'var(--accent)'}, transparent 85%)` : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0
                    }}
                  >
                    {s.done && <I.Check />}
                  </div>
                  <span
                    onClick={toggleSub}
                    style={{ fontSize: 12, color: s.done ? 'var(--text-subtle)' : 'var(--text-main)', textDecoration: s.done ? 'line-through' : 'none', cursor: 'pointer', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>
                    {s.title}
                  </span>
                </div>
                );
              })}
            </div>}

            {task.subtasks?.length > 0 && <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <div style={{ flex: 1, height: 3, borderRadius: 2, background: 'var(--border-subtle)' }}>
                <div style={{ width: `${task.progress || 0}%`, height: '100%', borderRadius: 2, background: MC[task.assignee] || 'var(--accent)', transition: 'width .2s' }} />
              </div>
              <span style={{ fontSize: 11, color: 'var(--text-subtle)' }}>{task.subtasks.filter(s => s.done).length}/{task.subtasks.length}</span>
            </div>}
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <span style={{ fontSize: 10, color: '#fff', fontWeight: 800, padding: '2px 6px', borderRadius: 4, background: PC[task.priority], letterSpacing: '.02em' }}>{task.priority}</span>
              {(task.actualHours ?? 0) > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'color-mix(in srgb, var(--accent), transparent 85%)', padding: '2px 6px', borderRadius: 4, border: '1px solid var(--accent)' }}>
                   <I.Clock s={10} />
                   <span style={{ fontSize: 9, fontWeight: 800, color: 'var(--accent)' }}>{task.actualHours}h</span>
                </div>
              )}
              {(() => {
                  const blocked = isTaskBlocked(task, tasks);
                  return blocked ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'color-mix(in srgb, var(--prio-critical), transparent 90%)', padding: '2px 6px', borderRadius: 4, border: '1px solid var(--prio-critical)' }}>
                      <div style={{ color: 'var(--prio-critical)', display: 'flex' }}><I.X s={10} /></div>
                      <span style={{ fontSize: 9, fontWeight: 800, color: 'var(--prio-critical)' }}>BLOCKED</span>
                    </div>
                  ) : null;
              })()}
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-main)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.4, marginBottom: 8, letterSpacing: '-0.01em' }}>{task.title}</div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              {(task.estHours ?? 0) > 0 && <span style={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: 12, color: 'var(--text-subtle)' }}><I.Clock />{task.estHours}h</span>}
              {task.deadline && <span style={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: 12, color: task.status !== 'completed' && parse(task.deadline)! < today ? '#f44747' : 'var(--text-subtle)' }}><I.Cal />{task.deadline.slice(5)}</span>}
              {task.comments?.length > 0 && <span style={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: 12, color: 'var(--text-subtle)' }}><I.Chat />{task.comments.length}</span>}
              {(task.dependencies || []).length > 0 && <span style={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: 12, color: 'var(--accent-purple)' }}><I.Link />{task.dependencies.length}</span>}
              <div style={{ marginLeft: 'auto' }}><Av name={task.assignee} size={22} /></div>
            </div>

            {hoveredTask === task.id && (
              <div style={{ marginTop: 10, paddingTop: 8, borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: 6 }}>
                {status === 'todo' && <button onClick={e => { e.stopPropagation(); onUpdate(task.id, { status: 'inprogress', ganttStart: fmt(today), ganttEnd: fmt(addD(today, 5)) }); addToast('Task Started'); }} style={{ flex: 1, background: '#007acc22', border: '1px solid #007acc44', borderRadius: 4, color: '#007acc', fontSize: 11, fontWeight: 700, padding: '4px 0', cursor: 'pointer' }}>START</button>}
                {status === 'inprogress' && <button onClick={e => { e.stopPropagation(); onUpdate(task.id, { status: 'completed', completedDate: fmt(today), progress: 100 }); addToast('Completed!', '#4ec9b0'); }} style={{ flex: 1, background: '#4ec9b022', border: '1px solid #4ec9b044', borderRadius: 4, color: '#4ec9b0', fontSize: 11, fontWeight: 700, padding: '4px 0', cursor: 'pointer' }}>COMPLETE</button>}
                {status === 'completed' && <button onClick={e => { e.stopPropagation(); onUpdate(task.id, { status: 'todo', completedDate: undefined }); addToast('Reopened'); }} style={{ flex: 1, background: 'color-mix(in srgb, var(--prio-medium), transparent 90%)', border: '1px solid color-mix(in srgb, var(--prio-medium), transparent 70%)', borderRadius: 4, color: 'var(--prio-medium)', fontSize: 11, fontWeight: 700, padding: '4px 0', cursor: 'pointer' }}>REOPEN</button>}
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
        { label: 'Delete Task', icon: <I.Trash />, danger: true, action: () => setConfirm({ title: 'Delete Task?', msg: 'Are you sure you want to delete this task?', onConfirm: () => { onDelete(ctxMenu.task.id); setConfirm(null); setCtxMenu(null); addToast('Task deleted', '#f44747'); } }) },
      ]} />}
      {confirm && <ConfirmDialog title={confirm.title} message={confirm.msg} onConfirm={confirm.onConfirm} onCancel={() => setConfirm(null)} />}
    </div>
  );
};
