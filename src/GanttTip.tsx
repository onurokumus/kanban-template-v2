import type { Task } from "./types.ts";
import { PC, MC, parse, today } from "./constants.ts";
import { Av } from "./Icons.tsx";

interface Props {
  task: Task;
  x: number;
  y: number;
}

export const GanttTip = ({ task, x, y }: Props) => {
  const overdue = task.deadline && task.status !== 'completed' && parse(task.deadline)! < today;
  return (
    <div style={{ position: 'fixed', left: x + 12, top: y - 8, background: 'var(--popover-bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '12px 16px', zIndex: 9000, boxShadow: 'var(--shadow)', maxWidth: 300, pointerEvents: 'none' }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-main)', marginBottom: 8, letterSpacing: '-.01em' }}>{task.title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, color: 'var(--text-dim)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Av name={task.assignee} size={18} />
          <span><span style={{ color: PC[task.priority], fontWeight: 700 }}>{task.priority}</span> · {task.assignee}</span>
        </div>
        {task.ganttStart && <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>📅 <span>{task.ganttStart} → {task.ganttEnd}</span></div>}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>⏱ <span>{task.estHours}h estimated</span></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>🎯 <span>Deadline: <span style={{ color: overdue ? '#f44747' : 'var(--text-subtle)', fontWeight: overdue ? 700 : 400 }}>{task.deadline}{overdue ? ' (OVERDUE)' : ''}</span></span></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
          <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'var(--hover)', overflow: 'hidden' }}>
            <div style={{ width: `${task.progress || 0}%`, height: '100%', borderRadius: 3, background: MC[task.assignee], transition: 'width .2s' }} />
          </div>
          <span style={{ fontSize: 13, color: MC[task.assignee], fontWeight: 700, minWidth: 35, textAlign: 'right' }}>{task.progress || 0}%</span>
        </div>
        {task.subtasks?.length > 0 && <span style={{ fontSize: 12 }}>{task.subtasks.filter(s => s.done).length}/{task.subtasks.length} subtasks</span>}
      </div>
    </div>
  );
};
