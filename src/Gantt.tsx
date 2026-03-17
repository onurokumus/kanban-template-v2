import { useState, useMemo, useEffect, useLayoutEffect, useRef, Fragment } from "react";
import type { Task } from "./types.ts";
import { MEMBERS, MC, PC, PRIORITIES, ROW_H, today, fmt, parse, diffD, addD } from "./constants.ts";
import { I, Av } from "./Icons.tsx";
import { GanttTip } from "./GanttTip.tsx";
import { CtxMenu } from "./CtxMenu.tsx";

interface Props {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onUpdate: (id: string, u: Partial<Task>) => void;
  searchFilter: string;
  memberFilter: string[];
  tagFilter: string[];
  priorityFilter: string[];
  zoom: string;
}

interface DragState {
  taskId: string;
  subtaskId?: string;
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

const SIDEBAR_W = 170;

export const Gantt = ({ tasks, onTaskClick, onUpdate, searchFilter, memberFilter, tagFilter, priorityFilter, zoom }: Props) => {
  const [cLanes, setCLanes] = useState<Record<string, boolean>>({});
  const [drag, setDrag] = useState<DragState | null>(null);
  const [tip, setTip] = useState<TipState | null>(null);
  const [ctxMenu, setCtxMenu] = useState<CtxMenuState | null>(null);
  const gRef = useRef<HTMLDivElement>(null);

  // Dynamic range state: start with +/- 1 month
  const [range, setRange] = useState({ 
    start: addD(today, -30), 
    end: addD(today, 30) 
  });

  const DAY_W = zoom === 'month' ? 8 : (zoom === 'week' ? 20 : 44);

  const dates = useMemo(() => {
    const d: Date[] = [];
    const totalDays = diffD(range.start, range.end);
    for (let i = 0; i <= totalDays; i++) {
      d.push(addD(range.start, i));
    }
    return d;
  }, [range]);

  const todayIdx = useMemo(() => {
    const tStr = today.toDateString();
    return dates.findIndex(d => d.toDateString() === tStr);
  }, [dates]);

  // Initial scroll to today
  const [initialScrolled, setInitialScrolled] = useState(false);
  const lastDayW = useRef(DAY_W);
  const pendingPrepRef = useRef<number>(0);
  const isExpandingRef = useRef<boolean>(false);

  useLayoutEffect(() => {
    if (!gRef.current) return;
    const vW = gRef.current.clientWidth - SIDEBAR_W;
    
    if (!initialScrolled) {
      if (todayIdx !== -1 && vW > 0) {
        // Center on the middle of Today
        gRef.current.scrollLeft = Math.round(todayIdx * DAY_W + DAY_W / 2 - vW / 2);
        setInitialScrolled(true);
      }
    } else if (lastDayW.current !== DAY_W) {
      // Zoom change compensation: keep relative center day-precise
      const centerPx = gRef.current.scrollLeft + vW / 2;
      const daysFromStart = centerPx / lastDayW.current;
      gRef.current.scrollLeft = Math.round(daysFromStart * DAY_W - vW / 2);
    }
    lastDayW.current = DAY_W;
  }, [DAY_W, todayIdx, initialScrolled]);

  useLayoutEffect(() => {
    if (pendingPrepRef.current > 0 && gRef.current) {
      gRef.current.scrollLeft += pendingPrepRef.current * DAY_W;
      pendingPrepRef.current = 0;
      isExpandingRef.current = false;
    }
  }, [dates, DAY_W]);

  // Infinite Scroll Handler
  const handleScroll = () => {
    if (!gRef.current || isExpandingRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = gRef.current;
    
    // Near left edge -> Prepend 60 days
    if (scrollLeft < 500) {
      isExpandingRef.current = true;
      const expansion = 60;
      pendingPrepRef.current = expansion;
      setRange(prev => ({ ...prev, start: addD(prev.start, -expansion) }));
    }
    
    // Near right edge -> Append 60 days
    else if (scrollWidth - (scrollLeft + clientWidth) < 500) {
      isExpandingRef.current = true;
      setRange(prev => ({ ...prev, end: addD(prev.end, 60) }));
      requestAnimationFrame(() => { isExpandingRef.current = false; });
    }
  };

  const filtered = useMemo(() => tasks.filter(t => {
    if (t.status !== 'inprogress') return false;
    if (searchFilter && !t.title.toLowerCase().includes(searchFilter.toLowerCase())) return false;
    if (memberFilter.length > 0 && !memberFilter.includes(t.assignee)) return false;
    if (tagFilter.length > 0 && !tagFilter.some(tf => (t.tags || []).includes(tf))) return false;
    if (priorityFilter.length > 0 && !priorityFilter.includes(t.priority)) return false;
    return true;
  }), [tasks, searchFilter, memberFilter, tagFilter, priorityFilter]);

  const mTasks = useMemo(() => {
    const m: Record<string, Task[]> = {};
    MEMBERS.forEach(n => (m[n] = []));
    filtered.forEach(t => { if (m[t.assignee]) m[t.assignee].push(t); });
    return m;
  }, [filtered]);

  const getTaskH = (t: Task) => 48 + (t.subtasks?.length || 0) * 20;

  const taskPositions = useMemo(() => {
    const pos: Record<string, { x: number; xEnd: number; y: number }> = {};
    let cumY = 56; 
    MEMBERS.forEach(m => {
      cumY += 36;
      if (!cLanes[m]) {
        (mTasks[m] || []).forEach((t) => {
          if (t.ganttStart && t.ganttEnd) {
            const s = diffD(range.start, t.ganttStart);
            const dur = diffD(t.ganttStart, t.ganttEnd);
            // Center the bar in the 48px main task area
            pos[t.id] = { x: s * DAY_W, xEnd: (s + Math.max(dur, 1)) * DAY_W, y: cumY + 24 };
          }
          cumY += getTaskH(t);
        });
      }
    });
    return pos;
  }, [mTasks, cLanes, DAY_W, range.start]);

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

  const handlePD = (e: React.PointerEvent, task: Task, mode: DragState["mode"], subtaskId?: string) => {
    e.stopPropagation(); e.preventDefault();
    const s = subtaskId ? task.subtasks.find(x => x.id === subtaskId)?.ganttStart : task.ganttStart;
    const end = subtaskId ? task.subtasks.find(x => x.id === subtaskId)?.deadline : task.ganttEnd;
    if (!s || !end) return;
    setDrag({ taskId: task.id, subtaskId, mode, startX: e.clientX, oS: s, oE: end });
  };

  useEffect(() => {
    if (!drag) return;
    const move = (e: PointerEvent) => {
      const dx = e.clientX - drag.startX;
      const dd = Math.round(dx / DAY_W);
      const oS = parse(drag.oS)!, oE = parse(drag.oE)!;
      const target = tasks.find(t => t.id === drag.taskId);
      if (!target) return;

      if (drag.subtaskId) {
        let nS: string | undefined, nE: string | undefined;
        const subs = target.subtasks.map(s => {
          if (s.id !== drag.subtaskId) return s;
          if (drag.mode === 'move') { nS = fmt(addD(oS, dd)); nE = fmt(addD(oE, dd)); return { ...s, ganttStart: nS, deadline: nE }; }
          if (drag.mode === 'rl') { const ns = addD(oS, dd); if (diffD(ns, oE) >= 1) { nS = fmt(ns); return { ...s, ganttStart: nS }; } return s; }
          const ne = addD(oE, dd); if (diffD(oS, ne) >= 1) { nE = fmt(ne); return { ...s, deadline: nE }; } return s;
        });
        const update: Partial<Task> = { subtasks: subs };
        if (target.status === 'inprogress') {
          if (nS && target.ganttStart && nS < target.ganttStart) update.ganttStart = nS;
          if (nE && target.deadline && nE > target.deadline) { update.ganttEnd = nE; update.deadline = nE; }
        }
        onUpdate(drag.taskId, update);
      } else {
        if (drag.mode === 'move') { const ne = fmt(addD(oE, dd)); onUpdate(drag.taskId, { ganttStart: fmt(addD(oS, dd)), ganttEnd: ne, deadline: ne }); }
        else if (drag.mode === 'rl') { const ns = addD(oS, dd); if (diffD(ns, oE) >= 1) onUpdate(drag.taskId, { ganttStart: fmt(ns) }); }
        else if (drag.mode === 'rr') { const ne = addD(oE, dd); if (diffD(oS, ne) >= 1) { const neF = fmt(ne); onUpdate(drag.taskId, { ganttEnd: neF, deadline: neF }); } }
      }
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
    <div 
      ref={gRef}
      onScroll={handleScroll}
      style={{ flex: 1, overflow: 'auto', position: 'relative', background: '#1e1e1e', overflowAnchor: 'none', boxSizing: 'border-box' }}
    >
      <div style={{ minWidth: SIDEBAR_W + dates.length * DAY_W, position: 'relative', boxSizing: 'border-box' }}>
        
        {/* HEADER ROW */}
        <div style={{ display: 'flex', position: 'sticky', top: 0, zIndex: 100, background: '#1e1e1e', height: 56, borderBottom: '1px solid #2d2d2d', boxSizing: 'border-box' }}>
          <div style={{ position: 'sticky', left: 0, zIndex: 110, width: SIDEBAR_W, flexShrink: 0, padding: '0 12px', display: 'flex', alignItems: 'center', fontSize: 11, color: '#888', fontWeight: 700, borderRight: '2px solid #3c3c3c', background: '#1e1e1e', height: 56, boxSizing: 'border-box', gap: 8 }}>
            <span style={{ flex: 1 }}>MEMBERS</span>
            <div style={{ display: 'flex', gap: 4 }}>
              <button 
                onClick={() => {
                  const all: Record<string, boolean> = {};
                  MEMBERS.forEach(m => all[m] = true);
                  setCLanes(all);
                }}
                style={{ background: '#2d2d2d', border: 'none', color: '#666', borderBottom: '1px solid #3c3c3c', borderRadius: 3, padding: '2px 4px', cursor: 'pointer', display: 'flex' }}
                title="Collapse All"
              >
                <I.Collapse s={10} />
              </button>
              <button 
                onClick={() => setCLanes({})}
                style={{ background: '#2d2d2d', border: 'none', color: '#666', borderBottom: '1px solid #3c3c3c', borderRadius: 3, padding: '2px 4px', cursor: 'pointer', display: 'flex' }}
                title="Open All"
              >
                <I.Expand s={10} />
              </button>
            </div>
          </div>
          
          <div style={{ display: 'flex' }}>
            {dates.map((d, i) => {
              const isT = d.toDateString() === today.toDateString();
              const isW = d.getDay() === 0 || d.getDay() === 6;
              const isMon = d.getDay() === 1;
              const isFirstD = d.getDate() === 1;
              const showLabel = zoom === 'month' ? isFirstD : (zoom === 'week' ? isMon : true);
              
              return (
                <div key={fmt(d)} style={{ 
                  width: DAY_W, 
                  flexShrink: 0, 
                  textAlign: 'center', 
                  borderRight: (zoom === 'month' && !isFirstD) ? 'none' : ((zoom === 'week' && !isMon) ? 'none' : '1px solid #333'), 
                  height: 56, 
                  display: 'flex', 
                  flexDirection: 'column', 
                  justifyContent: 'center', 
                  background: isT ? '#007acc18' : (isW && zoom === 'day') ? '#ffffff08' : 'transparent',
                  position: 'relative',
                  boxSizing: 'border-box'
                }}>
                  {showLabel && (
                    <div style={{ 
                      position: (zoom === 'week' || zoom === 'month') ? 'absolute' : 'static', 
                      left: (zoom === 'week' || zoom === 'month') ? 0 : 'auto',
                      width: zoom === 'month' ? DAY_W * 30 : (zoom === 'week' ? DAY_W * 7 : '100%'),
                      textAlign: (zoom === 'week' || zoom === 'month') ? 'left' : 'center',
                      paddingLeft: (zoom === 'week' || zoom === 'month') ? 8 : 0,
                      pointerEvents: 'none'
                    }}>
                      <div style={{ fontSize: 10, color: '#666', textTransform: 'uppercase' }}>
                        {zoom === 'month' ? d.getFullYear() : d.toLocaleDateString('en', { weekday: zoom === 'week' ? 'long' : 'short' })}
                      </div>
                      <div style={{ fontSize: (zoom === 'week' || zoom === 'month') ? 11 : 13, color: isT ? '#007acc' : '#aaa', fontWeight: isT ? 700 : 400 }}>
                        {zoom === 'month' ? d.toLocaleDateString('en', { month: 'long' }) : d.getDate()} {zoom === 'week' ? d.toLocaleDateString('en', { month: 'short' }) : ''}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* BODY AREA */}
        <div 
          style={{ position: 'relative' }}
          onDragOver={e => e.preventDefault()}
          onDrop={e => {
            e.preventDefault();
            const tid = e.dataTransfer.getData('tid');
            if (!tid) return;
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left - SIDEBAR_W;
            const dayIdx = Math.floor(x / DAY_W);
            const dropDate = dates[dayIdx] ? fmt(dates[dayIdx]) : fmt(today);
            const endD = fmt(addD(parse(dropDate)!, 5));
            onUpdate(tid, { status: 'inprogress', ganttStart: dropDate, ganttEnd: endD, deadline: endD, completedDate: undefined });
          }}
        >
          
          <div style={{ position: 'absolute', top: 0, left: SIDEBAR_W, bottom: 0, right: 0, pointerEvents: 'none', zIndex: 0 }}>
            {dates.map((d) => {
              const isMon = d.getDay() === 1;
              const isFirstD = d.getDate() === 1;
              const isW = d.getDay() === 0 || d.getDay() === 6;
              if (zoom === 'month' && !isFirstD) return null;
              if (zoom === 'week' && !isMon && !isW) return null;
              const i = diffD(range.start, d);
              return (
                <div key={fmt(d)} style={{ 
                  position: 'absolute', 
                  left: i * DAY_W, 
                  top: 0, bottom: 0, 
                  width: DAY_W, 
                  borderRight: (zoom === 'month' && !isFirstD) ? 'none' : ((zoom === 'week' && !isMon) ? 'none' : '1px solid #2d2d2d'), 
                  background: (isW && zoom !== 'month') ? '#ffffff04' : 'transparent',
                  boxSizing: 'border-box'
                }} />
              );
            })}
            {todayIdx !== -1 && (
              <div style={{ position: 'absolute', left: todayIdx * DAY_W, top: 0, bottom: 0, width: DAY_W, background: '#007acc08', borderLeft: '2px solid #007acc88', zIndex: 1 }} />
            )}
          </div>

          {depLines.length > 0 && <svg style={{ position: 'absolute', top: 0, left: SIDEBAR_W, width: dates.length * DAY_W, height: '100%', pointerEvents: 'none', zIndex: 8 }}>
            <defs><marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#888" /></marker></defs>
            {depLines.map((l, i) => {
              const x1 = l.from.xEnd + 2, y1 = l.from.y - 56; 
              const x2 = l.to.x - 2, y2 = l.to.y - 56;
              const mx = (x1 + x2) / 2;
              return <path key={i} d={`M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`} stroke={l.color + '88'} strokeWidth="1.5" fill="none" markerEnd="url(#arrow)" strokeDasharray={Math.abs(y2 - y1) > ROW_H ? "4,3" : "none"} />;
            })}
          </svg>}



          {MEMBERS.map(member => {
            const mt = mTasks[member] || [];
            const isC = cLanes[member];
            const laneH = isC ? 0 : mt.reduce((acc, t) => acc + getTaskH(t), 0);

            return (
              <div key={member} style={{ borderBottom: '1px solid #2d2d2d' }}>
                <div style={{ display: 'flex', height: 36, alignItems: 'center', background: '#252526', cursor: 'pointer', position: 'sticky', left: 0, zIndex: 20, boxSizing: 'border-box' }} onClick={() => setCLanes(p => ({ ...p, [member]: !p[member] }))}>
                  <div style={{ width: SIDEBAR_W, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6, padding: '0 12px', borderRight: '2px solid #3c3c3c', position: 'sticky', left: 0, background: '#252526', zIndex: 21, height: '100%', boxSizing: 'border-box' }}>
                    <I.Chev open={!isC} s={12} />
                    <Av name={member} size={18} />
                    <span style={{ fontSize: 13, color: '#d4d4d4', fontWeight: 600 }}>{member}</span>
                    <span style={{ fontSize: 12, color: '#888', marginLeft: 'auto' }}>{mt.length}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'row', position: 'relative' }}>
                  {/* Sticky Labels Layer */}
                  <div style={{ 
                    width: SIDEBAR_W, 
                    flexShrink: 0, 
                    position: 'sticky', 
                    left: 0, 
                    zIndex: 15, 
                    background: '#1e1e1e', 
                    borderRight: '2px solid #3c3c3c',
                    overflow: 'hidden', 
                    transition: 'max-height .25s ease', 
                    maxHeight: isC ? 0 : laneH + 10,
                    boxSizing: 'border-box'
                  }}>
                    {mt.map((t) => (
                      <div key={t.id} style={{ height: getTaskH(t), display: 'flex', flexDirection: 'column', borderBottom: '1px solid #ffffff05', boxSizing: 'border-box' }}>
                        <div 
                          draggable 
                          onDragStart={e => e.dataTransfer.setData('tid', t.id)}
                          style={{ height: 48, display: 'flex', alignItems: 'center', padding: '0 10px', gap: 5, cursor: 'pointer' }} 
                          onClick={() => onTaskClick(t)} 
                          onContextMenu={e => handleCtx(e, t)}
                        >
                          <div style={{ width: 4, height: 4, borderRadius: '50%', background: PC[t.priority], flexShrink: 0 }} />
                          <span style={{ fontSize: 12, color: '#bbb', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, fontWeight: 500 }}>{t.title}</span>
                          {(t.dependencies || []).length > 0 && <span style={{ opacity: .4 }}><I.Link /></span>}
                        </div>
                        {(t.subtasks || []).length > 0 && (
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            {t.subtasks.map(s => (
                              <div key={s.id} style={{ height: 20, display: 'flex', alignItems: 'center', padding: '0 10px 0 24px', fontSize: 11, color: '#666' }}>
                                <div style={{ width: 5, height: 5, borderRadius: '50%', border: `1px solid ${s.done ? MC[t.assignee] : '#444'}`, background: s.done ? MC[t.assignee] : 'transparent', marginRight: 6, flexShrink: 0 }} />
                                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textDecoration: s.done ? 'line-through' : 'none' }}>{s.title}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Bars layer */}
                  <div style={{ flex: 1, position: 'relative', overflow: 'hidden', transition: 'max-height .25s ease', maxHeight: isC ? 0 : laneH + 10 }}>
                    <div style={{ minHeight: laneH, position: 'relative' }}>
                      {mt.map((t, idx) => {
                        let taskTop = 0;
                        for (let j = 0; j < idx; j++) taskTop += getTaskH(mt[j]);
                        
                        if (!t.ganttStart || !t.ganttEnd) return null;
                        const s = diffD(range.start, t.ganttStart);
                        const dur = diffD(t.ganttStart, t.ganttEnd);
                        const left = s * DAY_W, width = Math.max(dur * DAY_W, DAY_W);
                        const overdue = t.status !== 'completed' && t.deadline && parse(t.deadline)! < today;
                        const bc = MC[t.assignee], prog = t.progress || 0;

                        return (
                          <Fragment key={t.id}>
                            <div
                              onContextMenu={e => handleCtx(e, t)}
                              onMouseEnter={e => setTip({ task: t, x: e.clientX, y: e.clientY })}
                              onMouseMove={e => { if (tip?.task?.id === t.id) setTip({ task: t, x: e.clientX, y: e.clientY }); }}
                              onMouseLeave={() => setTip(null)}
                              style={{ position: 'absolute', top: taskTop + 5, left, width, height: 38, borderRadius: 4, background: '#1e1e1e', border: `1.5px solid ${bc}66`, cursor: drag?.taskId === t.id ? 'grabbing' : 'grab', zIndex: 12, transition: (drag?.taskId === t.id || isExpandingRef.current) ? 'none' : 'left .15s,width .15s', userSelect: 'none', overflow: 'hidden' }}>
                              <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '100%', background: `${bc}18`, pointerEvents: 'none' }} />
                              <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${prog}%`, background: `${bc}66`, borderRadius: '3px 0 0 3px', transition: 'width .2s', pointerEvents: 'none' }} />
                              <div onPointerDown={e => handlePD(e, t, 'rl')} style={{ position: 'absolute', left: -2, top: 0, bottom: 0, width: 8, cursor: 'ew-resize', zIndex: 13 }}>
                                <div style={{ position: 'absolute', left: 2, top: '30%', bottom: '30%', width: 2, borderRadius: 1, background: bc, opacity: .4 }} />
                              </div>
                              <div onPointerDown={e => handlePD(e, t, 'move')} onClick={() => { if (!drag) onTaskClick(t); }} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 4, padding: '0 12px', overflow: 'hidden', height: '100%', position: 'relative', zIndex: 1 }}>
                                <span style={{ fontSize: 12, color: '#ddd', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.title}</span>
                                {overdue && <span style={{ fontSize: 10, color: '#f44747', fontWeight: 700, flexShrink: 0 }}>!</span>}
                                <span style={{ fontSize: 11, color: bc, marginLeft: 'auto', fontWeight: 600, flexShrink: 0 }}>{prog}%</span>
                              </div>
                              <div onPointerDown={e => handlePD(e, t, 'rr')} style={{ position: 'absolute', right: -2, top: 0, bottom: 0, width: 8, cursor: 'ew-resize', zIndex: 13 }}>
                                <div style={{ position: 'absolute', right: 2, top: '30%', bottom: '30%', width: 2, borderRadius: 1, background: bc, opacity: .4 }} />
                              </div>
                            </div>
                            {(t.subtasks || []).map((s, si) => {
                              if (!s.ganttStart || !s.deadline) return null;
                              const ss = diffD(range.start, parse(s.ganttStart)!);
                              const sdur = diffD(parse(s.ganttStart)!, parse(s.deadline)!);
                              const sl = ss * DAY_W, sw = Math.max(sdur * DAY_W, DAY_W);
                              const isD = drag?.subtaskId === s.id;
                              return (
                                <div 
                                  key={s.id} 
                                  style={{ 
                                    position: 'absolute', 
                                    top: taskTop + 48 + si * 20 + 6, 
                                    left: sl, width: sw, height: 8, 
                                    borderRadius: 4, 
                                    background: s.done ? bc + 'cc' : '#333', 
                                    border: `1px solid ${s.done ? bc : isD ? bc : '#444'}`,
                                    zIndex: 11,
                                    cursor: isD ? 'grabbing' : 'grab',
                                    transition: (isD || isExpandingRef.current) ? 'none' : 'left .1s, width .1s'
                                  }} 
                                  onPointerDown={e => handlePD(e, t, 'move', s.id)}
                                  title={`${s.title} (${s.ganttStart} to ${s.deadline})`}
                                >
                                  {/* Subtask resize handles */}
                                  <div onPointerDown={e => handlePD(e, t, 'rl', s.id)} style={{ position: 'absolute', left: -2, top: 0, bottom: 0, width: 6, cursor: 'ew-resize', zIndex: 1 }} />
                                  <div onPointerDown={e => handlePD(e, t, 'rr', s.id)} style={{ position: 'absolute', right: -2, top: 0, bottom: 0, width: 6, cursor: 'ew-resize', zIndex: 1 }} />
                                </div>
                              );
                            })}
                          </Fragment>
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
