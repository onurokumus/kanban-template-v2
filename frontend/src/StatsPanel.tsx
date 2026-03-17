import { useState, useMemo, Fragment } from "react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip as RTooltip, ResponsiveContainer, Cell, PieChart, Pie, CartesianGrid } from "recharts";
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
  const [selectedMember, setSelectedMember] = useState<string | 'all'>('all');
  const [hoveredCell, setHoveredCell] = useState<{ member: string; index: number; x: number; y: number } | null>(null);

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
    const relevantTasks = selectedMember === 'all' ? tasks : tasks.filter(t => t.assignee === selectedMember);
    const days: { date: string; remaining: number; ideal: number }[] = [];
    const totalEst = relevantTasks.length;

    // 30 day range: -15 to +15
    for (let i = -15; i <= 15; i++) {
      const d = addD(today, i);
      const totalInRange = relevantTasks.filter(t => parse(t.created)! <= d).length;
      const completedInRange = relevantTasks.filter(t => t.status === 'completed' && t.completedDate && parse(t.completedDate)! <= d).length;
      const remaining = totalInRange - completedInRange;

      const ideal = Math.max(0, Math.round(totalEst * (1 - (i + 15) / 30)));
      days.push({ date: fmt(d).slice(5), remaining, ideal });
    }
    return days;
  }, [tasks, selectedMember]);

  const heatmap = useMemo(() => {
    const data: Record<string, any>[] = [];
    for (let i = 0; i < 30; i++) {
      const d = addD(ganttOrigin, i);
      const ds = fmt(d);
      const row: Record<string, any> = { date: ds.slice(5), fullDate: ds };
      MEMBERS.forEach(m => {
        const activeTasks = tasks.filter(t => t.status === 'inprogress' && t.ganttStart && t.ganttEnd && parse(t.ganttStart)! <= d && parse(t.ganttEnd)! >= d && t.assignee === m);
        row[m] = activeTasks.length;
        row[m + '_tasks'] = activeTasks.map(t => {
          const start = parse(t.ganttStart!)!;
          const end = parse(t.ganttEnd!)!;
          const duration = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
          return { title: t.title, dailyHrs: (t.estHours || 0) / duration };
        });
        row[m + '_hrs'] = row[m + '_tasks'].reduce((s: number, t: any) => s + t.dailyHrs, 0);
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
      <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, width: 950, maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,.5)' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 12, background: 'var(--bg)', zIndex: 1 }}>
          <I.Chart />
          <span style={{ color: 'var(--text-main)', fontSize: 16, fontWeight: 600, flex: 1 }}>Kezban Analytics</span>
          <div style={{ display: 'flex', background: 'var(--bg-alt)', padding: 2, borderRadius: 6, border: '1px solid var(--border)' }}>
            {(["overview", "burndown", "heatmap", "tags"] as ViewKey[]).map(v => (
              <button key={v} onClick={() => setView(v)} style={{ padding: '5px 14px', borderRadius: 4, border: 'none', background: view === v ? 'var(--accent)' : 'transparent', color: view === v ? '#fff' : 'var(--text-dim)', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', textTransform: 'capitalize', transition: 'all .2s' }}>{v}</button>
            ))}
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', marginLeft: 8, padding: 4 }}><I.X /></button>
        </div>

        <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
            {[{ l: 'Total Tasks', v: tasks.length, c: 'var(--accent)', sub: 'Project Scope' },
            { l: 'Pending', v: tasks.filter(t => t.status !== 'completed').length, c: 'var(--prio-medium)', sub: 'Remaining' },
            { l: 'Active', v: tasks.filter(t => t.status === 'inprogress').length, c: 'var(--accent)', sub: 'Current Work' },
            { l: 'Done', v: tasks.filter(t => t.status === 'completed').length, c: 'var(--accent-purple)', sub: 'Finished' }].map(s => (
              <div key={s.l} style={{ background: 'var(--bg-card)', borderRadius: 8, padding: '14px', border: '1px solid var(--border)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, width: 3, height: '100%', background: s.c }} />
                <div style={{ color: 'var(--text-subtle)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 600 }}>{s.l}</div>
                <div style={{ color: s.c, fontSize: 28, fontWeight: 700, marginTop: 4 }}>{s.v}</div>
                <div style={{ color: 'var(--text-dim)', fontSize: 11, marginTop: 2 }}>{s.sub}</div>
              </div>
            ))}
          </div>

          {view === 'overview' && <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {memberStats.map(s => (
              <div key={s.name} style={{ background: 'var(--bg-alt)', borderRadius: 8, padding: '16px', border: '1px solid var(--border-subtle)', transition: 'border-color .2s' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)55'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-subtle)'}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
                  <Av name={s.name} size={40} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ color: 'var(--text-main)', fontSize: 15, fontWeight: 600 }}>{s.name}</span>
                      <span style={{ fontSize: 11, color: 'var(--text-dim)', background: 'var(--bg)', padding: '2px 6px', borderRadius: 10 }}>{s.total} Tasks</span>
                    </div>
                    <div style={{ color: 'var(--text-dim)', fontSize: 12, marginTop: 2 }}>{s.totalH}h Estimated · {s.doneH}h Completed ({Math.round(s.doneH / s.totalH * 100 || 0)}%)</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: s.vel >= 60 ? '#4ec9b0' : s.vel >= 30 ? '#dcdcaa' : '#f44747', fontSize: 22, fontWeight: 800 }}>{s.vel}%</div>
                    <div style={{ color: 'var(--text-subtle)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '.1em' }}>Efficiency</div>
                  </div>
                  {s.overdue > 0 && <div style={{ background: '#f4474718', color: '#f44747', fontSize: 12, padding: '4px 10px', borderRadius: 4, transform: 'rotate(2deg)', border: '1px solid #f4474744', fontWeight: 600 }}>{s.overdue} Overdue</div>}
                </div>
                <div style={{ display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden', background: 'var(--bg)', padding: 1, border: '1px solid var(--border-subtle)' }}>
                  {s.done > 0 && <div style={{ flex: s.done, background: '#4ec9b0', transition: 'all .5s' }} title="Done" />}
                  {s.ip > 0 && <div style={{ flex: s.ip, background: 'var(--accent)', transition: 'all .5s' }} title="In Progress" />}
                  {s.todo > 0 && <div style={{ flex: s.todo, background: 'var(--hover)', transition: 'all .5s' }} title="To Do" />}
                </div>
                <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: 12, color: 'var(--text-dim)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ color: '#4ec9b0' }}>●</span> {s.done} Done</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ color: 'var(--accent)' }}>●</span> {s.ip} In Progress</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ color: 'var(--text-subtle)' }}>●</span> {s.todo} Pending</div>
                </div>
              </div>
            ))}
          </div>}

          {view === 'burndown' && <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <h4 style={{ color: 'var(--text-main)', fontSize: 15, fontWeight: 600, margin: 0 }}>Project Burndown</h4>
              <div style={{ display: 'flex', gap: 4, background: 'var(--bg-alt)', padding: 3, borderRadius: 6, border: '1px solid var(--border)' }}>
                <button onClick={() => setSelectedMember('all')} style={{ padding: '3px 10px', borderRadius: 3, border: 'none', background: selectedMember === 'all' ? 'var(--accent)' : 'var(--hover)', color: selectedMember === 'all' ? '#fff' : 'var(--text-dim)', fontSize: 11, cursor: 'pointer' }}>Global</button>
                {MEMBERS.map(m => (
                  <button key={m} onClick={() => setSelectedMember(m)} style={{ padding: '3px 10px', borderRadius: 3, border: 'none', background: selectedMember === m ? MC[m] : 'var(--hover)', color: selectedMember === m ? '#fff' : 'var(--text-dim)', fontSize: 11, cursor: 'pointer' }}>{m}</button>
                ))}
              </div>
            </div>
            <div style={{ background: 'var(--bg-alt)', borderRadius: 8, padding: '24px 16px', border: '1px solid var(--border-subtle)' }}>
              <ResponsiveContainer width="100%" height={320}>
                <AreaChart data={burndown}>
                  <defs>
                    <linearGradient id="colorRemain" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="date" stroke="var(--text-dim)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--text-dim)" fontSize={11} tickLine={false} axisLine={false} />
                  <RTooltip
                    contentStyle={{ background: 'var(--popover-bg)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, boxShadow: 'var(--shadow)' }}
                    itemStyle={{ color: 'var(--text-main)' }}
                    labelStyle={{ color: 'var(--text-dim)', marginBottom: 4 }}
                  />
                  <Area type="monotone" dataKey="ideal" stroke="var(--text-subtle)" fill="transparent" strokeDasharray="5 5" name="Ideal Baseline" />
                  <Area type="monotone" dataKey="remaining" stroke="var(--accent)" strokeWidth={3} fillOpacity={1} fill="url(#colorRemain)" name="Remaining Effort" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>}

          {view === 'heatmap' && <div>
            <h4 style={{ color: 'var(--text-main)', fontSize: 15, fontWeight: 600, marginBottom: 12 }}>Resource Workload Heatmap <span style={{ color: 'var(--text-dim)', fontWeight: 400, fontSize: 13 }}>— Daily Active Tasks & Estimated Hours</span></h4>
            <div style={{ background: 'var(--bg-alt)', borderRadius: 8, border: '1px solid var(--border-subtle)', overflowX: 'auto', padding: '16px', position: 'relative' }} className="stats-scroll">
              <style>{`.stats-scroll::-webkit-scrollbar { height: 10px; } .stats-scroll::-webkit-scrollbar-thumb { background: var(--scroll-thumb); border-radius: 5px; }`}</style>
              <div style={{ display: 'grid', gridTemplateColumns: `100px repeat(${heatmap.length}, minmax(44px, 1fr))`, gap: 4, minWidth: 1200 }}>
                <div />
                {heatmap.map((d, i) => <div key={i} style={{ textAlign: 'center', color: 'var(--text-dim)', padding: '4px 0', fontSize: 11, fontWeight: 600 }}>{d.date as string}</div>)}

                {MEMBERS.map(m => (
                  <Fragment key={m}>
                    <div style={{ color: MC[m], fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, padding: '6px 4px', fontSize: 12 }}><Av name={m} size={20} />{m}</div>
                    {heatmap.map((d, i) => {
                      const v = (d[m] as number) || 0;
                      const hrs = (d[m + '_hrs'] as number) || 0;
                      const bg = v === 0 ? 'var(--bg)' : 
                                v === 1 ? `color-mix(in srgb, ${MC[m]}, transparent 92%)` : 
                                v === 2 ? `color-mix(in srgb, ${MC[m]}, transparent 80%)` : 
                                v === 3 ? `color-mix(in srgb, ${MC[m]}, transparent 60%)` : 
                                `color-mix(in srgb, ${MC[m]}, transparent 30%)`;
                      const isHigh = hrs > 6;
                      return (
                        <div key={m + i}
                          onMouseEnter={e => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            setHoveredCell({ member: m, index: i, x: rect.left + rect.width / 2, y: rect.top });
                          }}
                          onMouseLeave={() => setHoveredCell(null)}
                          style={{ background: bg, borderRadius: 4, height: 42, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: v > 0 ? 'var(--text-main)' : 'var(--text-subtle)', border: isHigh ? `1.5px solid ${MC[m]}` : '1.5px solid var(--border-subtle)', transition: 'all .2s', cursor: 'default' }}>
                          <span style={{ fontSize: 13, fontWeight: 800, lineHeight: 1.1 }}>{v > 0 ? v : ''}</span>
                          {hrs > 0 && <span style={{ fontSize: 11, fontWeight: 600, opacity: 0.85, lineHeight: 1 }}>{hrs % 1 === 0 ? hrs : hrs.toFixed(1)}h</span>}
                        </div>
                      );
                    })}
                  </Fragment>
                ))}
              </div>

              {hoveredCell && heatmap[hoveredCell.index] && (
                <div style={{
                  position: 'fixed', left: hoveredCell.x, top: hoveredCell.y - 10, transform: 'translate(-50%, -100%)',
                  background: 'var(--popover-bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '12px 16px', zIndex: 6000,
                  pointerEvents: 'none', boxShadow: 'var(--shadow)', minWidth: 220
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 8 }}>
                    <Av name={hoveredCell.member} size={20} />
                    <span style={{ color: 'var(--text-main)', fontSize: 13, fontWeight: 600 }}>{hoveredCell.member}</span>
                    <span style={{ color: 'var(--text-subtle)', fontSize: 11, marginLeft: 'auto' }}>{heatmap[hoveredCell.index].fullDate}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {heatmap[hoveredCell.index][hoveredCell.member + '_tasks'].length > 0 ? (
                      heatmap[hoveredCell.index][hoveredCell.member + '_tasks'].map((t: any, i: number) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                          <span style={{ color: 'var(--text-dim)', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</span>
                          <span style={{ color: MC[hoveredCell.member], fontSize: 11, fontWeight: 600 }}>{t.dailyHrs % 1 === 0 ? t.dailyHrs : t.dailyHrs.toFixed(1)}h</span>
                        </div>
                      ))
                    ) : (
                      <div style={{ color: 'var(--text-subtle)', fontSize: 12 }}>No active tasks</div>
                    )}
                  </div>
                  <div style={{ marginTop: 8, paddingTop: 6, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                    <span style={{ color: 'var(--text-subtle)' }}>Daily Total:</span>
                    <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{heatmap[hoveredCell.index][hoveredCell.member + '_hrs'].toFixed(1)}h</span>
                  </div>
                </div>
              )}
            </div>

            <div style={{ marginTop: 24 }}>
              <h4 style={{ color: 'var(--text-main)', fontSize: 15, fontWeight: 600, marginBottom: 12 }}>Total Capacity Distribution <span style={{ color: 'var(--text-dim)', fontWeight: 400, fontSize: 13 }}>(Project Hours Breakdown)</span></h4>
              <div style={{ background: 'var(--bg-alt)', borderRadius: 8, padding: 16, border: '1px solid var(--border-subtle)' }}>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={memberStats}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="name" stroke="var(--text-dim)" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="var(--text-dim)" fontSize={11} tickLine={false} axisLine={false} />
                    <RTooltip
                      contentStyle={{ background: 'var(--popover-bg)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, boxShadow: 'var(--shadow)' }}
                      itemStyle={{ color: 'var(--text-main)' }}
                      labelStyle={{ color: 'var(--text-dim)', marginBottom: 4 }}
                      cursor={{ fill: 'color-mix(in srgb, var(--hover), transparent 60%)' }}
                    />
                    <Bar dataKey="totalH" name="Total Est. Hours" radius={[4, 4, 0, 0]}>
                      {memberStats.map((e, i) => <Cell key={i} fill={e.color} fillOpacity={0.8} />)}
                    </Bar>
                    <Bar dataKey="doneH" name="Completed Hours" radius={[4, 4, 0, 0]}>
                      {memberStats.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>}

          {view === 'tags' && <div>
            <h4 style={{ color: 'var(--text-main)', fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Project Focus & Categorization</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ background: 'var(--bg-alt)', borderRadius: 8, padding: 16, border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: 12, color: 'var(--text-subtle)', marginBottom: 16, textAlign: 'center', textTransform: 'uppercase', letterSpacing: '.05em' }}>Tag Frequency</div>
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={tagDist} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={60} strokeWidth={0} paddingAngle={4}>
                      {tagDist.map((_e, i) => <Cell key={i} fill={chartColors[i % chartColors.length]} />)}
                    </Pie>
                    <RTooltip
                      contentStyle={{ background: 'var(--popover-bg)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, boxShadow: 'var(--shadow)' }}
                      itemStyle={{ color: 'var(--text-main)' }}
                      labelStyle={{ color: 'var(--text-dim)', marginBottom: 4 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ background: 'var(--bg-alt)', borderRadius: 8, padding: 16, border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: 12, color: 'var(--text-subtle)', marginBottom: 16, textAlign: 'center', textTransform: 'uppercase', letterSpacing: '.05em' }}>Task Count Distribution</div>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={tagDist}>
                    <CartesianGrid strokeDasharray="2 2" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="name" stroke="var(--text-dim)" fontSize={11} tickLine={false} axisLine={false} height={40} angle={-30} textAnchor="end" />
                    <YAxis stroke="var(--text-dim)" fontSize={11} tickLine={false} axisLine={false} />
                    <RTooltip
                      contentStyle={{ background: 'var(--popover-bg)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, boxShadow: 'var(--shadow)' }}
                      itemStyle={{ color: 'var(--text-main)' }}
                      labelStyle={{ color: 'var(--text-dim)', marginBottom: 4 }}
                      cursor={{ fill: 'color-mix(in srgb, var(--hover), transparent 60%)' }}
                    />
                    <Bar dataKey="value" name="Tasks" radius={[4, 4, 0, 0]}>
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
