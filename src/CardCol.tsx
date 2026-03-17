import { useState, useMemo, Fragment } from "react";
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
  searchFilter: string;
  memberFilter: string;
  tagFilter: string;
  priorityFilter: string;
  onNewTask: (status: string) => void;
  toast: (msg: string, color?: string) => void;
}

interface CtxMenuState {
  x: number;
  y: number;
  task: Task;
}

export const CardCol = ({ title, status, tasks, color, collapsed, onToggle, onTaskClick, onUpdate, searchFilter, memberFilter, tagFilter, priorityFilter, onNewTask, toast: addToast }: Props) => {
  const [ctxMenu, setCtxMenu] = useState<CtxMenuState | null>(null);

  const fTasks = useMemo(() => tasks.filter(t => {
    if (t.status !== status) return false;
    if (searchFilter && !t.title.toLowerCase().includes(searchFilter.toLowerCase())) return false;
    if (memberFilter && t.assignee !== memberFilter) return false;
    if (tagFilter && !(t.tags || []).includes(tagFilter)) return false;
    if (priorityFilter && t.priority !== priorityFilter) return false;
    return true;
  }).sort((a, b) => {
    const pi = PRIORITIES.indexOf(a.priority as typeof PRIORITIES[number]) - PRIORITIES.indexOf(b.priority as typeof PRIORITIES[number]);
    return pi !== 0 ? pi : (a.deadline || '').localeCompare(b.deadline || '');
  }), [tasks, status, searchFilter, memberFilter, tagFilter, priorityFilter]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const tid = e.dataTransfer.getData('tid');
    if (!tid) return;
    const u: Partial<Task> = { status };
    if (status === 'completed') { u.completedDate = fmt(today); u.ganttStart = undefined; u.ganttEnd = undefined; u.progress = 100; }
    if (status === 'inprogress') { u.ganttStart = fmt(today); u.ganttEnd = fmt(addD(today, 5)); }
    if (status === 'todo') { u.ganttStart = undefined; u.ganttEnd = undefined; u.completedDate = undefined; }
    onUpdate(tid, u);
    addToast(`Task moved to ${title}`, '#007acc');
  };

  const handleCtx = (e: React.MouseEvent, task: Task) => {
    e.preventDefault();
    setCtxMenu({ x: e.clientX, y: e.clientY, task });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minWidth: collapsed ? 44 : 'auto', width: collapsed ? 44 : 290, transition: 'width .25s ease', flexShrink: 0, borderRight: '1px solid #2d2d2d', background: '#1e1e1e', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: collapsed ? '12px 8px' : '12px 14px', borderBottom: '1px solid #2d2d2d', cursor: 'pointer', background: '#252526', flexShrink: 0, height: 48, boxSizing: 'border-box' }} onClick={onToggle}>
        {collapsed ? <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, width: '100%' }}>
          <I.Chev open={false} s={12} />
          <div style={{ writingMode: 'vertical-rl', textOrientation: 'mixed', fontSize: 11, fontWeight: 600, color, letterSpacing: '.03em' }}>{title}</div>
          <div style={{ background: color + '22', color, fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 8 }}>{fTasks.length}</div>
        </div> : <Fragment>
          <I.Chev open={true} s={12} />
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: '#d4d4d4', flex: 1 }}>{title}</span>
          <span style={{ fontSize: 11, color: '#888', background: '#2d2d2d', padding: '1px 8px', borderRadius: 8, fontWeight: 600 }}>{fTasks.length}</span>
          <button onClick={e => { e.stopPropagation(); onNewTask(status); }} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', padding: 2 }}><I.Plus /></button>
        </Fragment>}
      </div>

      {!collapsed && <div style={{ flex: 1, overflowY: 'auto', padding: 8, display: 'flex', flexDirection: 'column', gap: 5 }} onDragOver={e => e.preventDefault()} onDrop={handleDrop}>
        {fTasks.map(task => (
          <div key={task.id} draggable onDragStart={e => e.dataTransfer.setData('tid', task.id)} onClick={() => onTaskClick(task)} onContextMenu={e => handleCtx(e, task)}
            style={{ background: '#252526', borderRadius: 6, padding: '10px 12px', cursor: 'pointer', border: '1px solid #2d2d2d', transition: 'border-color .15s,transform .15s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#007acc44'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#2d2d2d'; e.currentTarget.style.transform = 'none'; }}>
            {(task.tags || []).length > 0 && <div style={{ display: 'flex', gap: 3, marginBottom: 6, flexWrap: 'wrap' }}>
              {task.tags.map(t => <span key={t} style={{ background: TC[t] || '#333', color: '#bbb', fontSize: 9, padding: '1px 6px', borderRadius: 3, fontWeight: 500 }}>{t}</span>)}
            </div>}
            <div style={{ color: '#d4d4d4', fontSize: 12, fontWeight: 500, lineHeight: 1.4, marginBottom: 4 }}>{task.title}</div>
            {task.subtasks?.length > 0 && <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <div style={{ flex: 1, height: 3, borderRadius: 2, background: '#333' }}>
                <div style={{ width: `${task.progress || 0}%`, height: '100%', borderRadius: 2, background: MC[task.assignee] }} />
              </div>
              <span style={{ fontSize: 9, color: '#888' }}>{task.subtasks.filter(s => s.done).length}/{task.subtasks.length}</span>
            </div>}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 9, fontWeight: 700, color: PC[task.priority], textTransform: 'uppercase', letterSpacing: '.05em' }}>{task.priority}</span>
              {task.estHours && <span style={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: 10, color: '#666' }}><I.Clock />{task.estHours}h</span>}
              {task.deadline && <span style={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: 10, color: task.status !== 'completed' && parse(task.deadline)! < today ? '#f44747' : '#666' }}><I.Cal />{task.deadline.slice(5)}</span>}
              {task.comments?.length > 0 && <span style={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: 10, color: '#666' }}><I.Chat />{task.comments.length}</span>}
              {(task.dependencies || []).length > 0 && <span style={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: 10, color: '#c586c0' }}><I.Link />{task.dependencies.length}</span>}
              <div style={{ marginLeft: 'auto' }}><Av name={task.assignee} size={22} /></div>
            </div>
          </div>
        ))}
      </div>}

      {ctxMenu && <CtxMenu x={ctxMenu.x} y={ctxMenu.y} onClose={() => setCtxMenu(null)} items={[
        { label: 'Open Details', icon: <I.Edit />, action: () => onTaskClick(ctxMenu.task) },
        { label: 'Move to To Do', action: () => { onUpdate(ctxMenu.task.id, { status: 'todo', ganttStart: undefined, ganttEnd: undefined, completedDate: undefined }); addToast('Moved to To Do'); } },
        { label: 'Move to In Progress', action: () => { onUpdate(ctxMenu.task.id, { status: 'inprogress', ganttStart: fmt(today), ganttEnd: fmt(addD(today, 5)), completedDate: undefined }); addToast('Moved to In Progress'); } },
        { label: 'Move to Completed', icon: <I.Check />, action: () => { onUpdate(ctxMenu.task.id, { status: 'completed', completedDate: fmt(today), progress: 100 }); addToast('Completed!', '#4ec9b0'); } },
        { divider: true },
        ...PRIORITIES.map(p => ({ label: `Priority: ${p}`, icon: <span style={{ color: PC[p] }}>●</span>, action: () => onUpdate(ctxMenu.task.id, { priority: p }) })),
        { divider: true },
        { label: 'Delete Task', icon: <I.Trash />, danger: true, action: () => { /* handled by parent */ } },
      ]} />}
    </div>
  );
};
