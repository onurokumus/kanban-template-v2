import { useState, useMemo, useEffect, useLayoutEffect, useRef, Fragment } from "react";
import type { Task } from "./types.ts";
import { MEMBERS, MC, PC, PRIORITIES, ROW_H, today, fmt, parse, diffD, addD, isTaskBlocked } from "./constants.ts";
import { I, Av } from "./Icons.tsx";
import { GanttTip } from "./GanttTip.tsx";
import { CtxMenu } from "./CtxMenu.tsx";

interface Props {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onUpdate: (id: string, u: Partial<Task>, skipHistory?: boolean, skipSync?: boolean) => void;
  searchFilter: string;
  memberFilter: string[];
  tagFilter: string[];
  priorityFilter: string[];
  zoom: string;
  showArrows: boolean;
  onPushHistory?: () => void;
}

interface DragState {
  taskId: string;
  subtaskId?: string;
  mode: "move" | "rl" | "rr";
  startX: number;
  currentX: number;
  startY: number;
  currentY: number;
  axis: 'x' | 'y' | null;
  hoveredMember?: string;
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

export const Gantt = ({ tasks, onTaskClick, onUpdate, searchFilter, memberFilter, tagFilter, priorityFilter, zoom, showArrows, onPushHistory }: Props) => {
  const [cLanes, setCLanes] = useState<Record<string, boolean>>({});
  const [drag, setDrag] = useState<DragState | null>(null);
  const [tip, setTip] = useState<TipState | null>(null);
  const [ctxMenu, setCtxMenu] = useState<CtxMenuState | null>(null);
  const [pan, setPan] = useState<{ startX: number; scrollLeft: number } | null>(null);
  const gRef = useRef<HTMLDivElement>(null);
  const draggedRef = useRef(false);

  // Dynamic range state: start with +/- 1 month, expand to fit tasks
  const [range, setRange] = useState(() => {
    let minD = addD(today, -30);
    let maxD = addD(today, 30);
    tasks.forEach(t => {
      if (t.ganttStart) { const s = parse(t.ganttStart); if (s && s < minD) minD = s; }
      if (t.ganttEnd) { const e = parse(t.ganttEnd); if (e && e > maxD) maxD = e; }
      if (t.deadline) { const d = parse(t.deadline); if (d && d > maxD) maxD = d; }
      t.subtasks?.forEach(sub => {
        if (sub.ganttStart) { const s = parse(sub.ganttStart); if (s && s < minD) minD = s; }
        if (sub.deadline) { const e = parse(sub.deadline); if (e && e > maxD) maxD = e; }
      });
    });
    return { start: minD, end: addD(maxD, 14) };
  });

  useEffect(() => {
    let newStart = range.start;
    let newEnd = range.end;
    let changed = false;

    tasks.forEach(t => {
      if (t.ganttStart) { const s = parse(t.ganttStart); if (s && s < newStart) { newStart = s; changed = true; } }
      if (t.ganttEnd) { const e = parse(t.ganttEnd); if (e && e > newEnd) { newEnd = e; changed = true; } }
      if (t.deadline) { const e = parse(t.deadline); if (e && e > newEnd) { newEnd = e; changed = true; } }
      t.subtasks?.forEach(sub => {
        if (sub.ganttStart) { const s = parse(sub.ganttStart); if (s && s < newStart) { newStart = s; changed = true; } }
        if (sub.deadline) { const e = parse(sub.deadline); if (e && e > newEnd) { newEnd = e; changed = true; } }
      });
    });

    if (changed) {
      setRange(prev => ({
        start: newStart < prev.start ? newStart : prev.start,
        end: newEnd > prev.end ? addD(newEnd, 14) : prev.end
      }));
    }
  }, [tasks]);

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

  const scrollToToday = () => {
    if (!gRef.current) return;
    const vW = gRef.current.clientWidth - SIDEBAR_W;
    if (todayIdx !== -1 && vW > 0) {
      gRef.current.scrollTo({
        left: Math.round(todayIdx * DAY_W + DAY_W / 2 - vW / 2),
        behavior: 'smooth'
      });
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
    // Sort: Epics first, then their children right after, then regular tasks
    Object.keys(m).forEach(member => {
      const raw = m[member];
      const sorted: Task[] = [];
      const epicIds = new Set(raw.filter(t => t.isEpic).map(t => t.id));
      const children = new Map<string, Task[]>();
      const regular: Task[] = [];
      raw.forEach(t => {
        if (t.isEpic) return; // handled below
        if (t.epicId && epicIds.has(t.epicId)) {
          if (!children.has(t.epicId)) children.set(t.epicId, []);
          children.get(t.epicId)!.push(t);
        } else {
          regular.push(t);
        }
      });
      // Add epics with their children grouped right after
      raw.filter(t => t.isEpic).forEach(epic => {
        sorted.push(epic);
        (children.get(epic.id) || []).forEach(c => sorted.push(c));
      });
      // Add remaining regular tasks
      regular.forEach(t => sorted.push(t));
      m[member] = sorted;
    });
    return m;
  }, [filtered]);

  const getTaskH = (t: Task) => 48 + (t.subtasks?.length || 0) * 20;

  const { taskPositions, laneBounds } = useMemo(() => {
    const pos: Record<string, { x: number; xEnd: number; y: number }> = {};
    const bounds: Record<string, { top: number; bottom: number }> = {};
    let cumY = 56;
    MEMBERS.forEach(m => {
      if (memberFilter.length > 0 && !memberFilter.includes(m)) return;
      const top = cumY;
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
        if ((mTasks[m] || []).length === 0) cumY += 40; // Add min height for empty lane
      }
      bounds[m] = { top, bottom: cumY };
    });
    return { taskPositions: pos, laneBounds: bounds };
  }, [mTasks, cLanes, DAY_W, range.start, memberFilter]);

  const depLines = useMemo(() => {
    const lines: { from: { x: number; xEnd: number; y: number }; to: { x: number; xEnd: number; y: number }; color: string }[] = [];
    filtered.filter(t => (t.dependencies || []).length > 0).forEach(t => {
      (t.dependencies || []).forEach(dId => {
        const from = taskPositions[dId];
        const to = taskPositions[t.id];
        if (from && to) lines.push({ from, to, color: MC[t.assignee] || '#007acc' });
      });
    });
    return lines;
  }, [filtered, taskPositions]);

  const handlePD = (e: React.PointerEvent, task: Task, mode: DragState["mode"], subtaskId?: string) => {
    e.stopPropagation(); e.preventDefault();
    draggedRef.current = false;
    const s = subtaskId ? task.subtasks.find(x => x.id === subtaskId)?.ganttStart : task.ganttStart;
    const end = subtaskId ? task.subtasks.find(x => x.id === subtaskId)?.deadline : task.ganttEnd;
    if (!s || !end) return;
    if (onPushHistory) onPushHistory();
    setDrag({ taskId: task.id, subtaskId, mode, startX: e.clientX, currentX: e.clientX, startY: e.clientY, currentY: e.clientY, axis: null, oS: s, oE: end });
  };

  useEffect(() => {
    if (!drag) return;
    const move = (e: PointerEvent) => {
      const dx = e.clientX - drag.startX;
      const dy = e.clientY - drag.startY;

      let effectiveAxis = drag.axis;
      if (!effectiveAxis) {
        if (Math.abs(dx) > 5) effectiveAxis = 'x';
        else if (Math.abs(dy) > 5 && drag.mode === 'move' && !drag.subtaskId) effectiveAxis = 'y';

        if (effectiveAxis) {
          setDrag(prev => prev ? { ...prev, axis: effectiveAxis } : null);
        }
      }

      setDrag(prev => prev ? { ...prev, currentX: e.clientX, currentY: e.clientY } : null);

      if (Math.abs(dx) > 5 || Math.abs(dy) > 5) draggedRef.current = true;

      const dd = Math.round(dx / DAY_W);
      const oS = parse(drag.oS)!, oE = parse(drag.oE)!;
      const target = tasks.find(t => t.id === drag.taskId);
      if (!target) return;

      // Handle Horizontal Update
      if (effectiveAxis === 'x' || (!effectiveAxis && Math.abs(dx) > 0)) {
        if (!target.isEpic) {
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
            onUpdate(drag.taskId, update, true, true);
          } else {
            if (drag.mode === 'move') {
              const ne = fmt(addD(oE, dd));
              onUpdate(drag.taskId, { ganttStart: fmt(addD(oS, dd)), ganttEnd: ne, deadline: ne }, true, true);
            }
            else if (drag.mode === 'rl') { const ns = addD(oS, dd); if (diffD(ns, oE) >= 1) onUpdate(drag.taskId, { ganttStart: fmt(ns) }, true, true); }
            else if (drag.mode === 'rr') { const ne = addD(oE, dd); if (diffD(oS, ne) >= 1) { const neF = fmt(ne); onUpdate(drag.taskId, { ganttEnd: neF, deadline: neF }, true, true); } }
          }
        }
      }

      // Handle Vertical Update (visual only - track hovered member for highlighting)
      if (effectiveAxis === 'y') {
        if (drag.mode === 'move' && !drag.subtaskId) {
          let hMember: string | undefined;
          const draggedEl = document.getElementById(`task-bar-${drag.taskId}`);
          if (draggedEl) draggedEl.style.pointerEvents = 'none';
          const elUnderCursor = document.elementFromPoint(e.clientX, e.clientY);
          if (draggedEl) draggedEl.style.pointerEvents = 'auto';
          if (elUnderCursor) {
            const laneEl = elUnderCursor.closest('[data-member-lane]');
            if (laneEl) hMember = laneEl.getAttribute('data-member-lane') || undefined;
          }
          setDrag(prev => prev ? { ...prev, hoveredMember: hMember } : null);
        }
      }
    };
    const up = (e: PointerEvent) => {
      // When horizontal drag ends
      if (draggedRef.current && (drag.axis === 'x' || (!drag.axis && Math.abs(e.clientX - drag.startX) > 0))) {
        const dx = e.clientX - drag.startX;
        const dd = Math.round(dx / DAY_W);
        if (dd !== 0) {
          const target = tasks.find(t => t.id === drag.taskId);
          if (target && !target.isEpic) {
            const oS = parse(drag.oS)!, oE = parse(drag.oE)!;
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
              onUpdate(drag.taskId, update); // this one saves
            } else {
              const update: Partial<Task> = {};
              if (drag.mode === 'move') {
                const ne = fmt(addD(oE, dd));
                update.ganttStart = fmt(addD(oS, dd)); update.ganttEnd = ne; update.deadline = ne;
                if (target.subtasks && target.subtasks.length > 0) {
                  update.subtasks = target.subtasks.map(s => {
                    const newS = s.ganttStart ? fmt(addD(parse(s.ganttStart)!, dd)) : s.ganttStart;
                    const newE = s.deadline ? fmt(addD(parse(s.deadline)!, dd)) : s.deadline;
                    return { ...s, ganttStart: newS, deadline: newE };
                  });
                }
              } else if (drag.mode === 'rl') {
                const ns = addD(oS, dd);
                if (diffD(ns, oE) >= 1) update.ganttStart = fmt(ns);
              } else if (drag.mode === 'rr') {
                const ne = addD(oE, dd);
                if (diffD(oS, ne) >= 1) { const neF = fmt(ne); update.ganttEnd = neF; update.deadline = neF; }
              }
              if (Object.keys(update).length > 0) {
                onUpdate(drag.taskId, update); // this one saves
              }
            }
          }
        }
      }
      
      if (drag.mode === 'move' && !drag.subtaskId && drag.axis === 'y') {
        // Find the lane element directly by hit testing
        // Hide the dragged element temporarily so we can get the element underneath it
        const draggedEl = document.getElementById(`task-bar-${drag.taskId}`);
        if (draggedEl) draggedEl.style.pointerEvents = 'none';

        const elUnderCursor = document.elementFromPoint(e.clientX, e.clientY);

        if (draggedEl) draggedEl.style.pointerEvents = 'auto';

        if (elUnderCursor) {
          // Look for the closest lane wrapper
          const laneEl = elUnderCursor.closest('[data-member-lane]');
          if (laneEl) {
            const newAssignee = laneEl.getAttribute('data-member-lane');
            const target = tasks.find(t => t.id === drag.taskId);
            if (target && newAssignee && newAssignee !== target.assignee) {
              onUpdate(drag.taskId, { assignee: newAssignee });
            }
          }
        }
      }
      setDrag(null);
      requestAnimationFrame(() => { draggedRef.current = false; });
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    return () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
  }, [drag, onUpdate, DAY_W, tasks, laneBounds]);

  useEffect(() => {
    if (!pan) return;
    const move = (e: PointerEvent) => {
      if (!gRef.current) return;
      const dx = e.clientX - pan.startX;
      if (Math.abs(dx) > 3) draggedRef.current = true;
      gRef.current.scrollLeft = pan.scrollLeft - dx;
    };
    const up = () => setPan(null);
    window.addEventListener('pointermove', move, { passive: true });
    window.addEventListener('pointerup', up);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
  }, [pan]);

  const handlePanStart = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    if (!gRef.current) return;
    draggedRef.current = false;
    setPan({ startX: e.clientX, scrollLeft: gRef.current.scrollLeft });
  };

  const handleCtx = (e: React.MouseEvent, task: Task) => {
    e.preventDefault();
    setCtxMenu({ x: e.clientX, y: e.clientY, task });
  };

  return (
    <div
      ref={gRef}
      onScroll={handleScroll}
      onPointerDown={handlePanStart}
      style={{ flex: 1, overflow: 'auto', position: 'relative', background: 'var(--bg)', overflowAnchor: 'none', boxSizing: 'border-box', cursor: pan ? 'grabbing' : 'default', userSelect: pan ? 'none' : 'auto' }}
    >
      <div style={{ minWidth: SIDEBAR_W + dates.length * DAY_W, position: 'relative', boxSizing: 'border-box' }}>

        {/* HEADER ROW */}
        <div style={{ display: 'flex', position: 'sticky', top: 0, zIndex: 100, background: 'var(--bg)', height: 56, borderBottom: '1px solid var(--border-subtle)', boxSizing: 'border-box' }}>
          <div style={{ position: 'sticky', left: 0, zIndex: 110, width: SIDEBAR_W, flexShrink: 0, padding: '0 12px', display: 'flex', alignItems: 'center', fontSize: 11, color: 'var(--text-subtle)', fontWeight: 700, borderRight: '2px solid var(--border)', background: 'var(--bg)', height: 56, boxSizing: 'border-box', gap: 8 }}>
            <span style={{ flex: 1 }}>MEMBERS</span>
            <div style={{ display: 'flex', gap: 4 }}>
              <button
                onClick={() => {
                  const all: Record<string, boolean> = {};
                  MEMBERS.forEach(m => all[m] = true);
                  setCLanes(all);
                }}
                style={{ background: 'var(--hover)', border: 'none', color: 'var(--text-subtle)', borderBottom: '1px solid var(--border)', borderRadius: 3, padding: '2px 4px', cursor: 'pointer', display: 'flex' }}
                data-tooltip="Collapse All"
                data-tooltip-pos="bottom"
              >
                <I.Collapse s={10} />
              </button>
              <button
                onClick={() => setCLanes({})}
                style={{ background: 'var(--hover)', border: 'none', color: 'var(--text-subtle)', borderBottom: '1px solid var(--border)', borderRadius: 3, padding: '2px 4px', cursor: 'pointer', display: 'flex' }}
                data-tooltip="Open All"
                data-tooltip-pos="bottom"
              >
                <I.Expand s={10} />
              </button>
              <button
                onClick={scrollToToday}
                style={{ background: 'var(--hover)', border: 'none', color: 'var(--accent)', borderBottom: '1px solid var(--accent)', borderRadius: 3, padding: '2px 4px', cursor: 'pointer', display: 'flex' }}
                data-tooltip="Focus on Today"
                data-tooltip-pos="bottom"
              >
                <I.Cal />
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
                  borderRight: (zoom === 'month' && !isFirstD) ? 'none' : ((zoom === 'week' && !isMon) ? 'none' : '1px solid var(--border)'),
                  height: 56,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  background: isT ? 'var(--accent)18' : (isW && zoom === 'day') ? 'var(--text-main)08' : 'transparent',
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
                      <div style={{ fontSize: 10, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '.05em' }}>
                        {zoom === 'month' ? d.getFullYear() : d.toLocaleDateString('en', { weekday: zoom === 'week' ? 'long' : 'short' })}
                      </div>
                      <div style={{ fontSize: (zoom === 'week' || zoom === 'month') ? 11 : 13, color: isT ? 'var(--accent)' : 'var(--text-dim)', fontWeight: isT ? 700 : 400 }}>
                        {zoom === 'month' ? d.toLocaleDateString('en', { month: 'long' }) : d.getDate()}
                        {zoom === 'week' ? ' ' + d.toLocaleDateString('en', { month: 'short' }) : ''}
                      </div>
                      {zoom === 'day' && (isFirstD || i === 0) && (
                        <div style={{ position: 'absolute', top: 4, left: 4, whiteSpace: 'nowrap', fontSize: 9, fontWeight: 900, color: 'var(--accent)', opacity: 0.8, textTransform: 'uppercase' }}>
                          {d.toLocaleDateString('en', { month: 'short' })}
                        </div>
                      )}
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
                  borderRight: (zoom === 'month' && !isFirstD) ? 'none' : ((zoom === 'week' && !isMon) ? 'none' : '1px solid var(--border-subtle)'),
                  background: (isW && zoom !== 'month') ? 'var(--text-dim)08' : 'transparent',
                  boxSizing: 'border-box'
                }} />
              );
            })}
            {todayIdx !== -1 && (
              <div style={{ position: 'absolute', left: todayIdx * DAY_W, top: 0, bottom: 0, width: DAY_W, background: 'var(--accent)12', borderLeft: '2px solid var(--accent)44', zIndex: 1 }} />
            )}
          </div>

          {showArrows && depLines.length > 0 && <svg style={{ position: 'absolute', top: 0, left: SIDEBAR_W, width: dates.length * DAY_W, height: '100%', pointerEvents: 'none', zIndex: 8 }}>
            <defs><marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="var(--text-subtle)" /></marker></defs>
            {depLines.map((l, i) => {
              const x1 = l.from.xEnd + 2, y1 = l.from.y - 56;
              const x2 = l.to.x - 2, y2 = l.to.y - 56;
              const mx = (x1 + x2) / 2;
              return <path key={i} d={`M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`} stroke={l.color ? `color-mix(in srgb, ${l.color}, transparent 55%)` : 'var(--text-subtle)'} strokeWidth="1.5" fill="none" markerEnd="url(#arrow)" strokeDasharray={Math.abs(y2 - y1) > ROW_H ? "4,3" : "none"} />;
            })}
          </svg>}



          {MEMBERS.map(member => {
            if (memberFilter.length > 0 && !memberFilter.includes(member)) return null;
            const mt = mTasks[member] || [];
            const isC = cLanes[member];
            const laneH = isC ? 0 : (mt.length === 0 ? 40 : mt.reduce((acc, t) => acc + getTaskH(t), 0));

            // To properly highlight during drag, we rely on CSS pointer-events: none on the dragged bar
            // and checking the :hover state natively, OR we do a hit test using DOM APIs on move.
            // For a simpler React-driven approach without spamming hit tests, we'll keep a state in Gantt
            // but we need the pointermove to track the hovered member.
            // Let's modify pointermove to track `hoveredMember` in drag state.
            const isHovered = drag?.mode === 'move' && drag?.axis === 'y' && drag?.hoveredMember === member;

            return (
              <div key={member} data-member-lane={member} style={{ borderBottom: '1px solid var(--border-subtle)', background: isHovered ? 'var(--hover)' : 'transparent', transition: 'background .2s' }}>
                <div style={{ display: 'flex', height: 36, alignItems: 'center', background: 'var(--bg-alt)', cursor: 'pointer', position: 'sticky', left: 0, zIndex: 20, boxSizing: 'border-box' }} onClick={() => setCLanes(p => ({ ...p, [member]: !p[member] }))}>
                  <div style={{ width: SIDEBAR_W, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6, padding: '0 12px', borderRight: '2px solid var(--border)', position: 'sticky', left: 0, background: 'var(--bg-alt)', zIndex: 21, height: '100%', boxSizing: 'border-box' }}>
                    <I.Chev open={!isC} s={12} />
                    <Av name={member} size={18} />
                    <span style={{ fontSize: 13, color: 'var(--text-main)', fontWeight: 600 }}>{member}</span>
                    <span style={{ fontSize: 12, color: 'var(--text-subtle)', marginLeft: 'auto' }}>{mt.length}</span>
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
                    background: 'var(--bg)',
                    borderRight: '2px solid var(--border)',
                    overflow: 'hidden',
                    transition: 'max-height .25s ease',
                    maxHeight: isC ? 0 : laneH + 10,
                    boxSizing: 'border-box'
                  }}>
                    {mt.map((t, tIdx) => {
                      const isEpicChild = !!t.epicId;
                      const _epicParent = isEpicChild ? mt.find(x => x.id === t.epicId) : null;
                      // Check if next task is also a child of the same epic (for connector line)
                      const nextTask = mt[tIdx + 1];
                      const isLastChild = isEpicChild && (!nextTask || nextTask.epicId !== t.epicId);

                      return (
                        <div key={t.id} style={{ height: getTaskH(t), display: 'flex', flexDirection: 'column', borderBottom: '1px solid var(--border-subtle)', boxSizing: 'border-box', background: t.isEpic ? 'color-mix(in srgb, var(--accent), transparent 94%)' : 'transparent' }}>
                          <div
                            draggable
                            onDragStart={e => e.dataTransfer.setData('tid', t.id)}
                            style={{ height: 48, display: 'flex', alignItems: 'center', padding: t.isEpic ? '0 10px' : isEpicChild ? '0 10px 0 8px' : '0 10px', gap: 5, cursor: 'pointer' }}
                            onClick={() => onTaskClick(t)}
                            onContextMenu={e => handleCtx(e, t)}
                          >
                            {/* Epic row styling */}
                            {t.isEpic ? (
                              <>
                                <div style={{ width: 3, height: 28, borderRadius: 2, background: 'var(--accent)', flexShrink: 0 }} />
                                <span style={{ fontSize: 10, color: 'var(--accent)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.06em', background: 'color-mix(in srgb, var(--accent), transparent 82%)', padding: '1px 5px', borderRadius: 3, flexShrink: 0 }}>Epic</span>
                                <span style={{ fontSize: 12, color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, fontWeight: 700 }}>{t.title}</span>
                                <span style={{ fontSize: 10, color: 'var(--text-subtle)', flexShrink: 0 }}>{tasks.filter(ct => ct.epicId === t.id).length}</span>
                              </>
                            ) : isEpicChild ? (
                              /* Child task row — indented with L-shaped tree connector */
                              <>
                                <div style={{ width: 20, flexShrink: 0, position: 'relative', height: 48 }}>
                                  {/* Vertical trunk line — full height for middle children, half for last */}
                                  <div style={{ position: 'absolute', left: 8, top: 0, height: isLastChild ? '50%' : '100%', width: 0, borderLeft: '1.5px solid color-mix(in srgb, var(--accent), transparent 65%)' }} />
                                  {/* Horizontal branch to dot */}
                                  <div style={{ position: 'absolute', left: 8, top: '50%', width: 7, height: 0, borderTop: '1.5px solid color-mix(in srgb, var(--accent), transparent 65%)' }} />
                                  {/* Dot at branch end */}
                                  <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', width: 4, height: 4, borderRadius: '50%', background: 'var(--accent)', opacity: .5 }} />
                                </div>
                                <span style={{ fontSize: 12, color: 'var(--text-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, fontWeight: 500 }}>{t.title}</span>
                                {(t.dependencies || []).length > 0 && <span style={{ opacity: .4 }}><I.Link /></span>}
                              </>
                            ) : (
                              /* Regular task row */
                              <>
                                <div style={{ width: 4, height: 4, borderRadius: '50%', background: PC[t.priority], flexShrink: 0 }} />
                                <span style={{ fontSize: 12, color: 'var(--text-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, fontWeight: 500 }}>{t.title}</span>
                                {(t.dependencies || []).length > 0 && <span style={{ opacity: .4 }}><I.Link /></span>}
                              </>
                            )}
                          </div>
                          {(t.subtasks || []).length > 0 && (
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              {t.subtasks.map(s => (
                                <div key={s.id} style={{ height: 20, display: 'flex', alignItems: 'center', padding: '0 10px 0 24px', fontSize: 11, color: 'var(--text-subtle)' }}>
                                  <div style={{ width: 5, height: 5, borderRadius: '50%', border: `1px solid ${s.done ? MC[t.assignee] : 'var(--border)'}`, background: s.done ? MC[t.assignee] : 'transparent', marginRight: 6, flexShrink: 0 }} />
                                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textDecoration: s.done ? 'line-through' : 'none' }}>{s.title}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Bars layer */}
                  <div style={{ flex: 1, position: 'relative', overflow: (isC && !drag) ? 'hidden' : 'visible', transition: 'max-height .25s ease', maxHeight: isC ? 0 : laneH + 10 }}>
                    <div style={{ minHeight: laneH, position: 'relative' }}>
                      {mt.map((t, idx) => {
                        let taskTop = 0;
                        for (let j = 0; j < idx; j++) taskTop += getTaskH(mt[j]);

                        let left = 0, width = 0;
                        if (t.isEpic) {
                          left = -50000;
                          width = 100000;
                        } else {
                          if (!t.ganttStart || !t.ganttEnd) return null;
                          const s = diffD(range.start, t.ganttStart);
                          const dur = diffD(t.ganttStart, t.ganttEnd);
                          left = s * DAY_W;
                          width = Math.max(dur * DAY_W, DAY_W);
                        }

                        const isBlocked = isTaskBlocked(t, tasks);
                        const overdue = t.status !== 'completed' && t.deadline && parse(t.deadline)! < today;
                        const bc = MC[t.assignee], prog = t.progress || 0;

                        return (
                          <Fragment key={t.id}>
                            <div
                              id={`task-bar-${t.id}`}
                              onContextMenu={e => handleCtx(e, t)}
                              onMouseEnter={e => setTip({ task: t, x: e.clientX, y: e.clientY })}
                              onMouseMove={e => { if (tip?.task?.id === t.id) setTip({ task: t, x: e.clientX, y: e.clientY }); }}
                              onMouseLeave={() => setTip(null)}
                              style={{
                                position: 'absolute', top: taskTop + 5, left, width, height: 38, borderRadius: 4,
                                background: t.isEpic ? `color-mix(in srgb, ${bc}, transparent 85%)` : 'var(--bg)',
                                borderTop: `1.5px solid ${isBlocked ? 'var(--text-subtle)' : `color-mix(in srgb, ${bc}, transparent 60%)`}`,
                                borderBottom: `1.5px solid ${isBlocked ? 'var(--text-subtle)' : `color-mix(in srgb, ${bc}, transparent 60%)`}`,
                                borderLeft: t.isEpic ? 'none' : `1.5px solid ${isBlocked ? 'var(--text-subtle)' : `color-mix(in srgb, ${bc}, transparent 60%)`}`,
                                borderRight: t.isEpic ? 'none' : `1.5px solid ${isBlocked ? 'var(--text-subtle)' : `color-mix(in srgb, ${bc}, transparent 60%)`}`,
                                cursor: drag?.taskId === t.id ? 'grabbing' : 'pointer',
                                zIndex: drag?.taskId === t.id ? 20 : 12,
                                transition: (drag?.taskId === t.id || isExpandingRef.current) ? 'none' : 'left .15s,width .15s, transform .15s',
                                userSelect: 'none',
                                overflow: t.isEpic ? 'visible' : 'hidden',
                                filter: isBlocked ? 'grayscale(0.8) opacity(0.6)' : 'none',
                                transform: (drag?.taskId === t.id && drag.mode === 'move' && !drag.subtaskId && drag.axis === 'y')
                                  ? `translateY(${drag.currentY - drag.startY}px)` : 'none'
                              }}>
                              {!t.isEpic && <div style={{ position: 'absolute', inset: 0, borderRadius: 2, overflow: 'hidden' }}>
                                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '100%', background: `color-mix(in srgb, ${bc}, transparent 90%)`, pointerEvents: 'none' }} />
                                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${prog}%`, background: `color-mix(in srgb, ${bc}, transparent 60%)`, borderRadius: '3px 0 0 3px', transition: 'width .2s', pointerEvents: 'none' }} />
                              </div>}

                              {!t.isEpic && <div onPointerDown={e => handlePD(e, t, 'rl')} style={{ position: 'absolute', left: -2, top: 0, bottom: 0, width: 8, cursor: 'ew-resize', zIndex: 13 }}>
                                <div style={{ position: 'absolute', left: 2, top: '30%', bottom: '30%', width: 2, borderRadius: 1, background: bc, opacity: .4 }} />
                              </div>}

                              <div
                                onPointerDown={e => { if (!t.isEpic) handlePD(e, t, 'move'); else draggedRef.current = false; }}
                                onClick={() => { if (!draggedRef.current) onTaskClick(t); }}
                                style={{ position: t.isEpic ? 'sticky' : 'relative', left: t.isEpic ? `calc(50% + ${SIDEBAR_W / 2}px)` : undefined, transform: t.isEpic ? 'translateX(-50%)' : undefined, width: t.isEpic ? 'max-content' : '100%', display: 'flex', alignItems: 'center', gap: 4, padding: '0 12px', height: '100%', zIndex: 1, boxSizing: 'border-box' }}
                              >
                                {t.isEpic && <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 20, height: 20, color: bc }}><I.Link /></div>}
                                <span style={{ fontSize: 12, color: 'var(--text-main)', fontWeight: t.isEpic ? 700 : 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.title}</span>
                                {isBlocked && <I.X s={12} />}
                                {overdue && <span style={{ fontSize: 10, color: '#f44747', fontWeight: 700, flexShrink: 0 }}>!</span>}
                                {t.isEpic ? null : <span style={{ fontSize: 11, color: bc, marginLeft: 'auto', fontWeight: 600, flexShrink: 0 }}>{prog}%</span>}
                              </div>

                              {!t.isEpic && <div onPointerDown={e => handlePD(e, t, 'rr')} style={{ position: 'absolute', right: -2, top: 0, bottom: 0, width: 8, cursor: 'ew-resize', zIndex: 13 }}>
                                <div style={{ position: 'absolute', right: 2, top: '30%', bottom: '30%', width: 2, borderRadius: 1, background: bc, opacity: .4 }} />
                              </div>}
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
                                    background: s.done ? `color-mix(in srgb, ${bc}, transparent 20%)` : 'var(--hover)',
                                    border: `1px solid ${s.done ? bc : isD ? bc : 'var(--border)'}`,
                                    zIndex: 11,
                                    cursor: isD ? 'grabbing' : 'grab',
                                    transition: (isD || isExpandingRef.current) ? 'none' : 'left .1s, width .1s, transform .15s',
                                    transform: (drag?.taskId === t.id && drag.mode === 'move' && !drag.subtaskId) ?
                                      (drag.axis === 'y' ? `translateY(${drag.currentY - drag.startY}px)` :
                                        (drag.axis === 'x' ? `translateX(${Math.round((drag.currentX - drag.startX) / DAY_W) * DAY_W}px)` : 'none')) : 'none'
                                  }}
                                  onPointerDown={e => handlePD(e, t, 'move', s.id)}
                                  onMouseEnter={e => { e.currentTarget.style.zIndex = '100'; }}
                                  onMouseLeave={e => { e.currentTarget.style.zIndex = '11'; }}
                                  data-tooltip={`${s.title} (${s.ganttStart} → ${s.deadline})`}
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

          {/* Global Drag Axis Guide Lines */}
          {drag && drag.axis && !drag.subtaskId && (() => {
            const t = tasks.find(x => x.id === drag.taskId);
            if (!t || !t.ganttStart || !t.ganttEnd) return null;
            const s = diffD(range.start, t.ganttStart);
            const dur = diffD(t.ganttStart, t.ganttEnd);
            const left = s * DAY_W + SIDEBAR_W;
            const width = Math.max(dur * DAY_W, DAY_W);

            const pos = taskPositions[t.id];
            if (!pos) return null;

            if (drag.axis === 'y') {
              return (
                <div style={{ position: 'absolute', left, width, top: 0, bottom: 0, pointerEvents: 'none', zIndex: 30 }}>
                  <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 1, borderLeft: '1px dashed var(--accent)', opacity: 0.5 }} />
                  <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 1, borderRight: '1px dashed var(--accent)', opacity: 0.5 }} />
                </div>
              );
            } else if (drag.axis === 'x') {
              // pos.y is absolute from top of component, BODY AREA starts at 56
              const topEdge = pos.y - 56 - 19;
              const bottomEdge = pos.y - 56 + 19;
              return (
                <div style={{ position: 'absolute', left: SIDEBAR_W, right: 0, top: 0, bottom: 0, pointerEvents: 'none', zIndex: 30 }}>
                  <div style={{ position: 'absolute', top: topEdge, left: 0, right: 0, height: 1, borderTop: '1px dashed var(--accent)', opacity: 0.5 }} />
                  <div style={{ position: 'absolute', top: bottomEdge, left: 0, right: 0, height: 1, borderBottom: '1px dashed var(--accent)', opacity: 0.5 }} />
                </div>
              );
            }
            return null;
          })()}

        </div>
      </div>

      {tip && <GanttTip task={tip.task} x={tip.x} y={tip.y} allTasks={tasks} />}

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
