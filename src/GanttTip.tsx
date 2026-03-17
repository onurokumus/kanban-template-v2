import type { Task } from "./types.ts";
import { PC, MC, parse, today } from "./constants.ts";

interface Props {
  task: Task;
  x: number;
  y: number;
}

export const GanttTip = ({ task, x, y }: Props) => {
  const overdue = task.deadline && task.status !== 'completed' && parse(task.deadline)! < today;
  return (
    <div style={{ position: 'fixed', left: x + 12, top: y - 8, background: '#1e1e1e', border: '1px solid #3c3c3c', borderRadius: 6, padding: '10px 14px', zIndex: 9000, boxShadow: '0 8px 24px rgba(0,0,0,.5)', maxWidth: 280, pointerEvents: 'none' }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: '#d4d4d4', marginBottom: 6 }}>{task.title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3, fontSize: 11, color: '#999' }}>
        <span><span style={{ color: PC[task.priority] }}>●</span> {task.priority} · {task.assignee}</span>
        {task.ganttStart && <span>📅 {task.ganttStart} → {task.ganttEnd}</span>}
        <span>⏱ {task.estHours}h estimated</span>
        <span>Deadline: <span style={{ color: overdue ? '#f44747' : '#999' }}>{task.deadline}{overdue ? ' (OVERDUE)' : ''}</span></span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
          <div style={{ flex: 1, height: 4, borderRadius: 2, background: '#333' }}>
            <div style={{ width: `${task.progress || 0}%`, height: '100%', borderRadius: 2, background: MC[task.assignee], transition: 'width .2s' }} />
          </div>
          <span style={{ fontSize: 10, color: MC[task.assignee] }}>{task.progress || 0}%</span>
        </div>
        {task.subtasks?.length > 0 && <span style={{ fontSize: 10 }}>{task.subtasks.filter(s => s.done).length}/{task.subtasks.length} subtasks</span>}
      </div>
    </div>
  );
};
