import { useState, useMemo, useEffect, useRef, Fragment } from "react";
import type { Task } from "./types.ts";
import { MEMBERS, MC, PC, PRIORITIES, MILESTONES, GANTT_TOTAL_DAYS, ROW_H, ganttOrigin, today, fmt, parse, diffD, addD } from "./constants.ts";
import { I, Av } from "./Icons.tsx";
import { GanttTip } from "./GanttTip.tsx";
import { CtxMenu } from "./CtxMenu.tsx";

interface Props {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onUpdate: (id: string, u: Partial<Task>) => void;
  searchFilter: string;
  memberFilter: string;
  tagFilter: string;
  priorityFilter: string;
  zoom: string;
}

interface DragState {
  taskId: string;
  mode: "move" | "rl" | "rr";
  startX: number;
  oS: string;
  oE: string;
}

interface TipState {
  task: Task;
  x: number;
  y: number;
}

interface CtxMenuState {
  x: number;
  y: number;
  task: Task;
}

export const Gantt = ({ tasks, onTaskClick, onUpdate, searchFilter, memberFilter, tagFilter, priorityFilter, zoom }: Props) => {
  const [cLanes, setCLanes] = useState<Record<string, boolean>>({});
  const [drag, setDrag] = useState<DragState | null>(null);
  const [tip, setTip] = useState<TipState | null>(null);
  const [ctxMenu, setCtxMenu] = useState<CtxMenuState | null>(null);
  const gRef = useRef<HTMLDivElement>(null);

  const DAY_W = zoom === 'week' ? 20 : 44;

  const filtered = useMemo(() => tasks.filter(t => {
    if (t.status !== 'inprogress') return false;
    if (searchFilter && !t.title.toLowerCase().includes(searchFilter.toLowerCase())) return false;
    if (memberFilter && t.assignee !== memberFilter) return false;
    if (tagFilter && !(t.tags || []).includes(tagFilter)) return false;
    if (priorityFilter && t.priority !== priorityFilter) return false;
    return true;
  }), [tasks, searchFilter, memberFilter, tagFilter, priorityFilter]);

  const mTasks = useMemo(() => {
    const m: Record<string, Task[]> = {};
    MEMBERS.forEach(n => (m[n] = []));
    filtered.forEach(t => { if (m[t.assignee]) m[t.assignee].push(t); });
    return m;
  }, [filtered]);

  const dates = useMemo(() => Array.from({ length: GANTT_TOTAL_DAYS }, (_, i) => addD(ganttOrigin, i)), []);
  const todayOff = diffD(ganttOrigin, today);

  const taskPositions = useMemo(() => {
    const pos: Record<string, { x: number; xEnd: number; y: number }> = {};
    let cumY = 0;
    MEMBERS.forEach(m => {
      cumY += 36;
      if (!cLanes[m]) {
        (mTasks[m] || []).forEach((t, i) => {
          if (t.ganttStart && t.ganttEnd) {
            const s = diffD(ganttOrigin, parse(t.ganttStart)!);
            const dur = diffD(parse(t.ganttStart)!, parse(t.ganttEnd)!);
            pos[t.id] = { x: s * DAY_W, xEnd: (s + Math.max(dur, 1)) * DAY_W, y: cumY + i * ROW_H + ROW_H / 2 };
          }
        });
        cumY += Math.max(1, mTasks[m]?.length || 0) * ROW_H;
      }
    });
    return pos;
  }, [mTasks, cLanes, DAY_W]);

  const depLines = useMemo(() => {
    const lines: { from: { x: number; xEnd: number; y: number }; to: { x: number; xEnd: number; y: number }; color: string }[] = [];
    tasks.filter(t => t.status === 'inprogress' && (t.dependencies || []).length > 0).forEach(t => {
      (t.dependencies || []).forEach(dId => {
        const from = taskPositions[dId];
        const to = taskPositions[t.id];
        if (from && to) lines.push({ from, to, color: MC[t.assignee] || '#007acc' });
      });
    });
    return lines;
  }, [tasks, taskPositions]);

  const handlePD = (e: React.PointerEvent, task: Task, mode: DragState["mode"]) => {
    e.stopPropagation(); e.preventDefault();
    setDrag({ taskId: task.id, mode, startX: e.clientX, oS: task.ganttStart!, oE: task.ganttEnd! });
  };

  useEffect(() => {
    if (!drag) return;
    const move = (e: PointerEvent) => {
      const dx = e.clientX - drag.startX;
      const dd = Math.round(dx / DAY_W);
      const oS = parse(drag.oS)!, oE = parse(drag.oE)!;
      if (drag.mode === 'move') { onUpdate(drag.taskId, { ganttStart: fmt(addD(oS, dd)), ganttEnd: fmt(addD(oE, dd)) }); }
      else if (drag.mode === 'rl') { const ns = addD(oS, dd); if (diffD(ns, oE) >= 1) onUpdate(drag.taskId, { ganttStart: fmt(ns) }); }
      else if (drag.mode === 'rr') { const ne = addD(oE, dd); if (diffD(oS, ne) >= 1) onUpdate(drag.taskId, { ganttEnd: fmt(ne) }); }
    };
    const up = () => setDrag(null);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    return () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
  }, [drag, onUpdate, DAY_W]);

  const handleCtx = (e: React.MouseEvent, task: Task) => {
    e.preventDefault();
    setCtxMenu({ x: e.clientX, y: e.clientY, task });
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      {/* Header */}
      <div style={{ display: 'flex', flexShrink: 0, borderBottom: '1px solid #2d2d2d' }}>
        <div style={{ width: 170, flexShrink: 0, padding: '0 12px', display: 'flex', alignItems: 'center', fontSize: 10, color: '#888', fontWeight: 600, borderRight: '1px solid #2d2d2d', height: 44, background: '#1e1e1e', position: 'sticky', left: 0, zIndex: 2 }}>MEMBER / TASK</div>
        <div style={{ display: 'flex', overflow: 'hidden', flex: 1 }}>
          {dates.map((d, i) => {
            const isT = d.toDateString() === today.toDateString();
            const isW = d.getDay() === 0 || d.getDay() === 6;
            const showLabel = zoom === 'week' ? d.getDay() === 1 : true;
            return (
              <div key={i} style={{ width: DAY_W, flexShrink: 0, textAlign: 'center', borderRight: '1px solid #2d2d2d22', height: 44, display: 'flex', flexDirection: 'column', justifyContent: 'center', background: isT ? '#007acc12' : isW ? '#ffffff04' : 'transparent' }}>
                {showLabel && <Fragment><div style={{ fontSize: 8, color: '#666', textTransform: 'uppercase' }}>{d.toLocaleDateString('en', { weekday: 'short' })}</div>
                  <div style={{ fontSize: zoom === 'week' ? 9 : 11, color: isT ? '#007acc' : '#aaa', fontWeight: isT ? 700 : 400 }}>{d.getDate()}</div></Fragment>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'auto', position: 'relative' }} ref={gRef}>
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 170 + GANTT_TOTAL_DAYS * DAY_W, position: 'relative' }}>
          {depLines.length > 0 && <svg style={{ position: 'absolute', top: 0, left: 170, width: GANTT_TOTAL_DAYS * DAY_W, height: '100%', pointerEvents: 'none', zIndex: 4 }}>
            <defs><marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#888" /></marker></defs>
            {depLines.map((l, i) => {
              const x1 = l.from.xEnd + 2, y1 = l.from.y;
              const x2 = l.to.x - 2, y2 = l.to.y;
              const mx = (x1 + x2) / 2;
              return <path key={i} d={`M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`} stroke={l.color + '88'} strokeWidth="1.5" fill="none" markerEnd="url(#arrow)" strokeDasharray={Math.abs(y2 - y1) > ROW_H ? "4,3" : "none"} />;
            })}
          </svg>}

          {MILESTONES.map((ms, i) => {
            const off = diffD(ganttOrigin, parse(ms.date)!);
            if (off < 0 || off >= GANTT_TOTAL_DAYS) return null;
            return <div key={i} style={{ position: 'absolute', left: 170 + off * DAY_W + DAY_W / 2 - 1, top: 0, bottom: 0, width: 2, background: ms.color + '33', zIndex: 3, pointerEvents: 'none' }}>
              <div style={{ position: 'absolute', top: -2, left: -12, display: 'flex', flexDirection: 'column', alignItems: 'center', pointerEvents: 'auto' }} title={ms.label}>
                <I.Diamond c={ms.color} s={12} />
                <span style={{ fontSize: 8, color: ms.color, fontWeight: 600, whiteSpace: 'nowrap', marginTop: 2 }}>{ms.label}</span>
              </div>
            </div>;
          })}

          {MEMBERS.map(member => {
            const mt = mTasks[member] || [];
            const isC = cLanes[member];
            const laneH = isC ? 0 : Math.max(1, mt.length) * ROW_H;

            return (
              <div key={member} style={{ borderBottom: '1px solid #2d2d2d' }}>
                <div style={{ display: 'flex', height: 36, alignItems: 'center', background: '#252526', cursor: 'pointer', position: 'sticky', left: 0, zIndex: 1 }} onClick={() => setCLanes(p => ({ ...p, [member]: !p[member] }))}>
                  <div style={{ width: 170, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6, padding: '0 12px', borderRight: '1px solid #2d2d2d', position: 'sticky', left: 0, background: '#252526', zIndex: 2, height: '100%' }}>
                    <I.Chev open={!isC} s={12} />
                    <Av name={member} size={18} />
                    <span style={{ fontSize: 11, color: '#d4d4d4', fontWeight: 500 }}>{member}</span>
                    <span style={{ fontSize: 10, color: '#666', marginLeft: 'auto' }}>{mt.length}</span>
                  </div>
                </div>

                <div style={{ overflow: 'hidden', transition: 'max-height .25s ease', maxHeight: isC ? 0 : laneH + 10 }}>
                  <div style={{ display: 'flex', position: 'relative' }}>
                    <div style={{ width: 170, flexShrink: 0, borderRight: '1px solid #2d2d2d', position: 'sticky', left: 0, background: '#1e1e1e', zIndex: 2 }}>
                      {mt.length === 0 ? <div style={{ height: ROW_H, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#444' }}>—</div>
                        : mt.map(t => (
                          <div key={t.id} style={{ height: ROW_H, display: 'flex', alignItems: 'center', padding: '0 10px', gap: 5, cursor: 'pointer' }} onClick={() => onTaskClick(t)} onContextMenu={e => handleCtx(e, t)}>
                            <div style={{ width: 4, height: 4, borderRadius: '50%', background: PC[t.priority], flexShrink: 0 }} />
                            <span style={{ fontSize: 10, color: '#aaa', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{t.title}</span>
                            {(t.dependencies || []).length > 0 && <span style={{ opacity: .4 }}><I.Link /></span>}
                          </div>
                        ))}
                    </div>

                    <div style={{ flex: 1, position: 'relative', minHeight: mt.length === 0 ? ROW_H : mt.length * ROW_H }}>
                      {dates.map((d, i) => {
                        const isW = d.getDay() === 0 || d.getDay() === 6;
                        return <div key={i} style={{ position: 'absolute', left: i * DAY_W, top: 0, bottom: 0, width: DAY_W, borderRight: '1px solid #2d2d2d15', background: isW ? '#ffffff03' : 'transparent' }} />;
                      })}
                      <div style={{ position: 'absolute', left: todayOff * DAY_W + DAY_W / 2, top: 0, bottom: 0, width: 2, background: '#007acc44', zIndex: 1 }} />

                      {mt.map((t, idx) => {
                        if (!t.ganttStart || !t.ganttEnd) return null;
                        const s = diffD(ganttOrigin, parse(t.ganttStart)!);
                        const dur = diffD(parse(t.ganttStart)!, parse(t.ganttEnd)!);
                        const left = s * DAY_W;
                        const width = Math.max(dur * DAY_W, DAY_W);
                        const overdue = t.deadline && parse(t.deadline)! < today;
                        const bc = MC[t.assignee];
                        const prog = t.progress || 0;

                        return (
                          <div key={t.id}
                            onContextMenu={e => handleCtx(e, t)}
                            onMouseEnter={e => setTip({ task: t, x: e.clientX, y: e.clientY })}
                            onMouseMove={e => { if (tip?.task?.id === t.id) setTip({ task: t, x: e.clientX, y: e.clientY }); }}
                            onMouseLeave={() => setTip(null)}
                            style={{ position: 'absolute', top: idx * ROW_H + 5, left, width, height: ROW_H - 10, borderRadius: 4, background: `${bc}18`, border: `1.5px solid ${bc}66`, cursor: drag?.taskId === t.id ? 'grabbing' : 'grab', zIndex: 5, transition: drag?.taskId === t.id ? 'none' : 'left .15s,width .15s', userSelect: 'none', overflow: 'hidden' }}>
                            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${prog}%`, background: `${bc}25`, borderRadius: '3px 0 0 3px', transition: 'width .2s', pointerEvents: 'none' }} />
                            <div onPointerDown={e => handlePD(e, t, 'rl')} style={{ position: 'absolute', left: -2, top: 0, bottom: 0, width: 8, cursor: 'ew-resize', zIndex: 6 }}>
                              <div style={{ position: 'absolute', left: 2, top: '30%', bottom: '30%', width: 2, borderRadius: 1, background: bc, opacity: .4 }} />
                            </div>
                            <div onPointerDown={e => handlePD(e, t, 'move')} onClick={() => { if (!drag) onTaskClick(t); }} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 4, padding: '0 12px', overflow: 'hidden', height: '100%', position: 'relative', zIndex: 1 }}>
                              <span style={{ fontSize: 10, color: '#ddd', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.title}</span>
                              {overdue && <span style={{ fontSize: 8, color: '#f44747', fontWeight: 700, flexShrink: 0 }}>!</span>}
                              <span style={{ fontSize: 9, color: bc, marginLeft: 'auto', fontWeight: 600, flexShrink: 0 }}>{prog}%</span>
                            </div>
                            <div onPointerDown={e => handlePD(e, t, 'rr')} style={{ position: 'absolute', right: -2, top: 0, bottom: 0, width: 8, cursor: 'ew-resize', zIndex: 6 }}>
                              <div style={{ position: 'absolute', right: 2, top: '30%', bottom: '30%', width: 2, borderRadius: 1, background: bc, opacity: .4 }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {tip && <GanttTip task={tip.task} x={tip.x} y={tip.y} />}

      {ctxMenu && <CtxMenu x={ctxMenu.x} y={ctxMenu.y} onClose={() => setCtxMenu(null)} items={[
        { label: 'Open Details', icon: <I.Edit />, action: () => onTaskClick(ctxMenu.task) },
        { label: 'Move to To Do', action: () => onUpdate(ctxMenu.task.id, { status: 'todo', ganttStart: undefined, ganttEnd: undefined }) },
        { label: 'Move to Completed', icon: <I.Check />, action: () => onUpdate(ctxMenu.task.id, { status: 'completed', completedDate: fmt(today), ganttStart: undefined, ganttEnd: undefined, progress: 100 }) },
        { divider: true },
        ...PRIORITIES.map(p => ({ label: `Priority: ${p}`, icon: <span style={{ color: PC[p] }}>●</span>, action: () => onUpdate(ctxMenu.task.id, { priority: p }) })),
        { divider: true },
        ...MEMBERS.map(m => ({ label: `Assign → ${m}`, icon: <Av name={m} size={14} />, action: () => onUpdate(ctxMenu.task.id, { assignee: m }) })),
      ]} />}
    </div>
  );
};
