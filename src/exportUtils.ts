import type { Task } from "./types.ts";
import { fmt, today } from "./constants.ts";

const fmtTime = (sec: number) => {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return `${h}h ${m}m`;
};

export const exportCSV = (tasks: Task[]) => {
  const h = ['Title', 'Assignee', 'Priority', 'Status', 'Est Hours', 'Actual Hours', 'Deadline', 'Tags', 'Progress', 'Subtasks Done', 'Subtasks Total', 'Created', 'Completed'];
  const rows = tasks.map(t => [
    t.title, 
    t.assignee, 
    t.priority, 
    t.status, 
    t.estHours || 0, 
    t.actualHours || 0,
    t.deadline || '', 
    (t.tags || []).join(';'), 
    t.progress || 0, 
    (t.subtasks || []).filter(s => s.done).length, 
    (t.subtasks || []).length, 
    t.created || '', 
    t.completedDate || ''
  ]);
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
  w.document.write(`<html><head><title>Kanban Export</title><style>
    body{font-family:Segoe UI,sans-serif;background:#fff;color:#1e1e1e;padding:40px;line-height:1.5}
    h1{color:#007acc;border-bottom:2px solid #007acc;padding-bottom:10px;margin-bottom:20px}
    h2{color:#444;margin-top:40px;border-left:4px solid #007acc;padding-left:12px;font-size:1.4em}
    table{width:100%;border-collapse:collapse;margin:15px 0;box-shadow:0 0 10px rgba(0,0,0,0.05)}
    th,td{padding:10px 14px;border:1px solid #ddd;text-align:left;font-size:12px}
    th{background:#f8f9fa;color:#666;font-weight:700;text-transform:uppercase;font-size:10px}
    .p-critical{color:#f44747;font-weight:bold}.p-high{color:#ff8c00}.p-medium{color:#dcdcaa}.p-low{color:#608b4e}
    .subtask-list{margin:0;padding:0;list-style:none;font-size:11px;color:#666}
    .subtask-item{display:flex;align-items:center;gap:6px}
    .check{color:#4ec9b0}
  </style></head><body>
    <h1>Kanban Workspace Summary</h1>
    <p><strong>Generated:</strong> ${today.toLocaleDateString()} at ${today.toLocaleTimeString()}</p>
    ${['todo', 'inprogress', 'completed'].map(s => {
    const st = byStatus(s);
    if (st.length === 0) return '';
    return `<h2>${s.toUpperCase()} (${st.length})</h2>
      <table><tr><th>Task Details</th><th>Work Log</th><th>Status & Timing</th></tr>
      ${st.map(t => {
      const subs = t.subtasks || [];
      const subHtml = subs.length > 0 ? `<ul class="subtask-list">${subs.map(sb => `<li class="subtask-item"><span class="check">${sb.done ? '✓' : '○'}</span> ${sb.title}</li>`).join('')}</ul>` : '';
      return `<tr>
          <td><div style="font-weight:700;font-size:13px">${t.title}</div><div style="color:#888;font-size:11px">${t.assignee}</div>${subHtml}</td>
          <td><div style="font-size:11px">Est: ${t.estHours || 0}h</div><div style="font-size:11px">Act: ${t.actualHours || 0}h</div></td>
          <td><div class="p-${t.priority.toLowerCase()}">${t.priority}</div><div style="color:#666;font-size:11px">${t.progress || 0}% Done</div><div style="font-size:10px;color:#999">Due: ${t.deadline || '—'}</div></td>
        </tr>`;
    }).join('')}</table>`;
  }).join('')}
  </body></html>`);
  w.document.close();
  setTimeout(() => w.print(), 500);
};

export const exportMarkdown = (boardTitle: string, tasks: Task[]) => {
  let md = `# ${boardTitle}\n\nGenerated on ${today.toLocaleString()}\n\n`;
  ['todo', 'inprogress', 'completed'].forEach(s => {
    const st = tasks.filter(t => t.status === s);
    if (st.length === 0) return;
    md += `## ${s.charAt(0).toUpperCase() + s.slice(1)}\n\n`;
    st.forEach(t => {
      md += `### [${t.progress}%] ${t.title}\n`;
      md += `- **Assignee:** ${t.assignee}\n`;
      md += `- **Priority:** ${t.priority}\n`;
      md += `- **Log:** ${t.estHours || 0}h est / ${t.actualHours || 0}h actual\n`;
      if (t.deadline) md += `- **Deadline:** ${t.deadline}\n`;
      if (t.desc) md += `\n> ${t.desc.replace(/\n/g, '\n> ')}\n`;
      if (t.subtasks?.length > 0) {
        md += `\n**Subtasks:**\n`;
        t.subtasks.forEach(sb => {
          md += `- [${sb.done ? 'x' : ' '}] ${sb.title}\n`;
        });
      }
      md += `\n---\n\n`;
    });
  });
  const blob = new Blob([md], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = `kanban-${fmt(today)}.md`; a.click();
  URL.revokeObjectURL(url);
};
