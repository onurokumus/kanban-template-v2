import type { Task } from "./types.ts";
import { fmt, today } from "./constants.ts";

export const exportCSV = (tasks: Task[]) => {
  const h = ['Title', 'Assignee', 'Priority', 'Status', 'Est Hours', 'Deadline', 'Tags', 'Progress', 'Subtasks Done', 'Subtasks Total', 'Created', 'Completed'];
  const rows = tasks.map(t => [t.title, t.assignee, t.priority, t.status, t.estHours || 0, t.deadline || '', (t.tags || []).join(';'), t.progress || 0, (t.subtasks || []).filter(s => s.done).length, (t.subtasks || []).length, t.created || '', t.completedDate || '']);
  const csv = [h, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = `kanban-export-${fmt(today)}.csv`; a.click();
  URL.revokeObjectURL(url);
};

export const exportPDF = (tasks: Task[]) => {
  const w = window.open('', '_blank');
  if (!w) return;
  const byStatus = (s: string) => tasks.filter(t => t.status === s);
  w.document.write(`<html><head><title>Kanban Board Export</title><style>
    body{font-family:Segoe UI,sans-serif;background:#1e1e1e;color:#d4d4d4;padding:30px}
    h1{color:#007acc;border-bottom:2px solid #007acc;padding-bottom:10px}
    h2{color:#dcdcaa;margin-top:30px}
    table{width:100%;border-collapse:collapse;margin:10px 0}
    th,td{padding:8px 12px;border:1px solid #3c3c3c;text-align:left;font-size:12px}
    th{background:#252526;color:#888;font-weight:600;text-transform:uppercase;font-size:10px}
    .critical{color:#f44747}.high{color:#ff8c00}.medium{color:#dcdcaa}.low{color:#608b4e}
    @media print{body{background:#fff;color:#000}th{background:#eee;color:#333}td{border-color:#ddd}}
  </style></head><body>
    <h1 style="display:flex;align-items:center;gap:10px">Kezban <span style="color:#666;font-size:0.4em;vertical-align:middle;margin-top:2px">●</span> <span style="font-size:0.8em;color:#888;font-weight:400;margin-top:4px">K11C0</span></h1>
    <p>Exported: ${today.toLocaleDateString()}</p>
    ${['todo', 'inprogress', 'completed'].map(s => {
    const st = byStatus(s);
    return `<h2>${s === 'todo' ? 'To Do' : s === 'inprogress' ? 'In Progress' : 'Completed'} (${st.length})</h2>
      <table><tr><th>Title</th><th>Assignee</th><th>Priority</th><th>Est.H</th><th>Deadline</th><th>Progress</th><th>Tags</th></tr>
      ${st.map(t => `<tr><td>${t.title}</td><td>${t.assignee}</td><td class="${t.priority.toLowerCase()}">${t.priority}</td><td>${t.estHours || 0}</td><td>${t.deadline || '—'}</td><td>${t.progress || 0}%</td><td>${(t.tags || []).join(', ')}</td></tr>`).join('')}</table>`;
  }).join('')}
  </body></html>`);
  w.document.close();
  setTimeout(() => w.print(), 300);
};
