import { useState, useMemo, Fragment } from "react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip as RTooltip, ResponsiveContainer, Cell, PieChart, Pie, CartesianGrid, Legend } from "recharts";
import type { Task, MemberStat } from "./types.ts";
import { MEMBERS, MC, fmt, today, addD, parse, ganttOrigin } from "./constants.ts";
import { I, Av } from "./Icons.tsx";

interface Props {
  tasks: Task[];
  onClose: () => void;
}

type ViewKey = "overview" | "burndown" | "heatmap" | "tags";

export const StatsPanel = ({ tasks, onClose }: Props) => {
  const [view, setView] = useState<ViewKey>('overview');

  const memberStats = useMemo<MemberStat[]>(() => MEMBERS.map(m => {
    const mine = tasks.filter(t => t.assignee === m);
    const todo = mine.filter(t => t.status === 'todo').length;
    const ip = mine.filter(t => t.status === 'inprogress').length;
    const done = mine.filter(t => t.status === 'completed').length;
    const totalH = mine.reduce((s, t) => s + (t.estHours || 0), 0);
    const doneH = mine.filter(t => t.status === 'completed').reduce((s, t) => s + (t.estHours || 0), 0);
    const overdue = mine.filter(t => t.status !== 'completed' && t.deadline && parse(t.deadline)! < today).length;
    const vel = mine.length > 0 ? Math.round(done / mine.length * 100) : 0;
    return { name: m, total: mine.length, todo, ip, done, totalH, doneH, overdue, vel, color: MC[m] };
  }), [tasks]);

  const burndown = useMemo(() => {
    const days: { date: string; remaining: number; ideal: number }[] = [];
    for (let i = -14; i <= 14; i++) {
      const d = addD(today, i);
      const total = tasks.filter(t => parse(t.created)! <= d).length;
      const completed = tasks.filter(t => t.status === 'completed' && t.completedDate && parse(t.completedDate)! <= d).length;
      const remaining = total - completed;
      days.push({ date: fmt(d).slice(5), remaining, ideal: Math.max(0, Math.round(tasks.length * (1 - (i + 14) / 28))) });
    }
    return days;
  }, [tasks]);

  const heatmap = useMemo(() => {
    const data: Record<string, string | number>[] = [];
    for (let i = 0; i < 21; i++) {
      const d = addD(ganttOrigin, i + 7);
      const ds = fmt(d);
      const row: Record<string, string | number> = { date: ds.slice(5) };
      MEMBERS.forEach(m => {
        row[m] = tasks.filter(t => t.status === 'inprogress' && t.ganttStart && t.ganttEnd && parse(t.ganttStart)! <= d && parse(t.ganttEnd)! >= d && t.assignee === m).length;
      });
      data.push(row);
    }
    return data;
  }, [tasks]);

  const tagDist = useMemo(() => {
    const map: Record<string, number> = {};
    tasks.forEach(t => (t.tags || []).forEach(tag => { map[tag] = (map[tag] || 0) + 1; }));
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [tasks]);

  const chartColors = ['#569cd6', '#4ec9b0', '#ce9178', '#dcdcaa', '#c586c0', '#9cdcfe', '#d7ba7d', '#b5cea8'];

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)', zIndex: 5000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(3px)' }}>
      <div style={{ background: '#1e1e1e', border: '1px solid #3c3c3c', borderRadius: 8, width: 900, maxHeight: '90vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,.5)' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #2d2d2d', display: 'flex', alignItems: 'center', gap: 12, position: 'sticky', top: 0, background: '#1e1e1e', zIndex: 1 }}>
          <I.Chart />
          <span style={{ color: '#d4d4d4', fontSize: 14, fontWeight: 600, flex: 1 }}>Team Statistics & Analytics</span>
          <div style={{ display: 'flex', gap: 2 }}>
            {(["overview", "burndown", "heatmap", "tags"] as ViewKey[]).map(v => (
              <button key={v} onClick={() => setView(v)} style={{ padding: '4px 12px', borderRadius: 3, border: 'none', background: view === v ? '#007acc' : '#2d2d2d', color: view === v ? '#fff' : '#999', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit', textTransform: 'capitalize' }}>{v}</button>
            ))}
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', marginLeft: 8 }}><I.X /></button>
        </div>

        <div style={{ padding: '16px 20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 16 }}>
            {[{ l: 'Total', v: tasks.length, c: '#569cd6' }, { l: 'To Do', v: tasks.filter(t => t.status === 'todo').length, c: '#dcdcaa' }, { l: 'In Progress', v: tasks.filter(t => t.status === 'inprogress').length, c: '#007acc' }, { l: 'Completed', v: tasks.filter(t => t.status === 'completed').length, c: '#4ec9b0' }].map(s => (
              <div key={s.l} style={{ background: '#252526', borderRadius: 6, padding: '12px 14px', border: '1px solid #2d2d2d' }}>
                <div style={{ color: '#888', fontSize: 9, textTransform: 'uppercase', letterSpacing: '.08em' }}>{s.l}</div>
                <div style={{ color: s.c, fontSize: 24, fontWeight: 700, marginTop: 2 }}>{s.v}</div>
              </div>
            ))}
          </div>

          {view === 'overview' && <div>
            {memberStats.map(s => (
              <div key={s.name} style={{ background: '#252526', borderRadius: 6, padding: '12px 14px', marginBottom: 6, border: '1px solid #2d2d2d' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <Av name={s.name} size={30} />
                  <div style={{ flex: 1 }}>
                    <div style={{ color: '#d4d4d4', fontSize: 12, fontWeight: 600 }}>{s.name}</div>
                    <div style={{ color: '#666', fontSize: 10 }}>{s.total} tasks · {s.totalH}h est · {s.doneH}h done</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: s.vel >= 60 ? '#4ec9b0' : s.vel >= 30 ? '#dcdcaa' : '#f44747', fontSize: 18, fontWeight: 700 }}>{s.vel}%</div>
                    <div style={{ color: '#666', fontSize: 9, textTransform: 'uppercase' }}>Velocity</div>
                  </div>
                  {s.overdue > 0 && <div style={{ background: '#f4474718', color: '#f44747', fontSize: 10, padding: '3px 8px', borderRadius: 3, fontWeight: 600 }}>{s.overdue} overdue</div>}
                </div>
                <div style={{ display: 'flex', height: 6, borderRadius: 3, overflow: 'hidden', background: '#1e1e1e', gap: 1 }}>
                  {s.done > 0 && <div style={{ flex: s.done, background: '#4ec9b0', borderTopLeftRadius: 3, borderBottomLeftRadius: 3 }} />}
                  {s.ip > 0 && <div style={{ flex: s.ip, background: '#007acc' }} />}
                  {s.todo > 0 && <div style={{ flex: s.todo, background: '#dcdcaa44', borderTopRightRadius: 3, borderBottomRightRadius: 3 }} />}
                </div>
                <div style={{ display: 'flex', gap: 14, marginTop: 6, fontSize: 10, color: '#888' }}>
                  <span><span style={{ color: '#4ec9b0' }}>●</span> {s.done}</span>
                  <span><span style={{ color: '#007acc' }}>●</span> {s.ip}</span>
                  <span><span style={{ color: '#dcdcaa' }}>●</span> {s.todo}</span>
                </div>
              </div>
            ))}
          </div>}

          {view === 'burndown' && <div>
            <h4 style={{ color: '#d4d4d4', fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Sprint Burndown</h4>
            <div style={{ background: '#252526', borderRadius: 6, padding: 16, border: '1px solid #2d2d2d' }}>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={burndown}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="date" stroke="#666" fontSize={10} tickLine={false} />
                  <YAxis stroke="#666" fontSize={10} tickLine={false} />
                  <RTooltip contentStyle={{ background: '#1e1e1e', border: '1px solid #3c3c3c', borderRadius: 4, fontSize: 11 }} itemStyle={{ color: '#ccc' }} />
                  <Area type="monotone" dataKey="ideal" stroke="#555" fill="#55555520" strokeDasharray="5 5" name="Ideal" />
                  <Area type="monotone" dataKey="remaining" stroke="#007acc" fill="#007acc20" name="Remaining" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <h4 style={{ color: '#d4d4d4', fontSize: 13, fontWeight: 600, margin: '20px 0 12px' }}>Completion Velocity by Member</h4>
            <div style={{ background: '#252526', borderRadius: 6, padding: 16, border: '1px solid #2d2d2d' }}>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={memberStats} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" horizontal={false} />
                  <XAxis type="number" stroke="#666" fontSize={10} tickLine={false} domain={[0, 100]} />
                  <YAxis dataKey="name" type="category" stroke="#666" fontSize={11} tickLine={false} width={80} />
                  <RTooltip contentStyle={{ background: '#1e1e1e', border: '1px solid #3c3c3c', borderRadius: 4, fontSize: 11 }} formatter={(v) => `${v}%`} />
                  <Bar dataKey="vel" radius={[0, 3, 3, 0]} name="Velocity">
                    {memberStats.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>}

          {view === 'heatmap' && <div>
            <h4 style={{ color: '#d4d4d4', fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Workload Heatmap <span style={{ color: '#888', fontWeight: 400, fontSize: 11 }}>(active tasks per day)</span></h4>
            <div style={{ background: '#252526', borderRadius: 6, padding: 16, border: '1px solid #2d2d2d', overflowX: 'auto' }}>
              <div style={{ display: 'grid', gridTemplateColumns: `80px repeat(${heatmap.length},1fr)`, gap: 2, fontSize: 10 }}>
                <div />
                {heatmap.map((d, i) => <div key={i} style={{ textAlign: 'center', color: '#666', padding: '2px 0' }}>{d.date as string}</div>)}
                {MEMBERS.map(m => <Fragment key={m}>
                  <div style={{ color: MC[m], fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4, padding: '2px 4px' }}><Av name={m} size={16} />{m}</div>
                  {heatmap.map((d, i) => {
                    const v = (d[m] as number) || 0;
                    const bg = v === 0 ? '#1e1e1e' : v === 1 ? MC[m] + '33' : v === 2 ? MC[m] + '66' : MC[m] + 'aa';
                    return <div key={m + i} style={{ background: bg, borderRadius: 2, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', color: v > 0 ? '#fff' : '#333', fontSize: 9, fontWeight: 600 }}>{v > 0 ? v : ''}</div>;
                  })}
                </Fragment>)}
              </div>
            </div>
          </div>}

          {view === 'tags' && <div>
            <h4 style={{ color: '#d4d4d4', fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Task Distribution by Tag</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ background: '#252526', borderRadius: 6, padding: 16, border: '1px solid #2d2d2d' }}>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={tagDist} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={45} strokeWidth={0}>
                      {tagDist.map((_e, i) => <Cell key={i} fill={chartColors[i % chartColors.length]} />)}
                    </Pie>
                    <RTooltip contentStyle={{ background: '#1e1e1e', border: '1px solid #3c3c3c', borderRadius: 4, fontSize: 11 }} />
                    <Legend iconSize={8} wrapperStyle={{ fontSize: 11, color: '#ccc' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ background: '#252526', borderRadius: 6, padding: 16, border: '1px solid #2d2d2d' }}>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={tagDist}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="name" stroke="#666" fontSize={10} tickLine={false} angle={-30} textAnchor="end" height={50} />
                    <YAxis stroke="#666" fontSize={10} tickLine={false} />
                    <RTooltip contentStyle={{ background: '#1e1e1e', border: '1px solid #3c3c3c', borderRadius: 4, fontSize: 11 }} />
                    <Bar dataKey="value" radius={[3, 3, 0, 0]}>
                      {tagDist.map((_e, i) => <Cell key={i} fill={chartColors[i % chartColors.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>}
        </div>
      </div>
    </div>
  );
};
