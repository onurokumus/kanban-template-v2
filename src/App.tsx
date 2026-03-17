import { useState, useRef, useCallback, useEffect } from "react";
import type { Task, Toast } from "./types.ts";
import { MEMBERS, PRIORITIES, TAGS, MC, fmt, today, addD, parse, initTasks } from "./constants.ts";
import { I, Av } from "./Icons.tsx";
import { ToastContainer } from "./ToastContainer.tsx";
import { TaskModal } from "./TaskModal.tsx";
import { NewTaskModal } from "./NewTaskModal.tsx";
import { StatsPanel } from "./StatsPanel.tsx";
import { Gantt } from "./Gantt.tsx";
import { CardCol } from "./CardCol.tsx";
import { exportCSV, exportPDF } from "./exportUtils.ts";

export default function App() {
  const [tasks, setTasks] = useState<Task[]>(initTasks);
  const [sel, setSel] = useState<Task | null>(null);
  const [newTask, setNewTask] = useState<string | null>(null);
  const [showStats, setShowStats] = useState(false);
  const [colC, setColC] = useState({ todo: false, completed: false, ip: false });
  const [search, setSearch] = useState('');
  const [memberF, setMemberF] = useState<string[]>([]);
  const [tagF, setTagF] = useState<string[]>([]);
  const [prioF, setPrioF] = useState<string[]>([]);
  const [zoom, setZoom] = useState('day');
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [history, setHistory] = useState<Task[][]>([]);
  const [future, setFuture] = useState<Task[][]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [isGanttOver, setIsGanttOver] = useState(false);
  const ganttDragCounter = useRef(0);
  const searchRef = useRef<HTMLInputElement>(null);

  const addToast = useCallback((msg: string, color = '#007acc') => {
    const id = Date.now();
    setToasts(p => [...p, { id, msg, color }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3000);
  }, []);

  const removeToast = useCallback((id: number) => setToasts(p => p.filter(t => t.id !== id)), []);

  const pushHistory = useCallback(() => {
    setHistory(p => [...p.slice(-30), JSON.parse(JSON.stringify(tasks))]);
    setFuture([]);
  }, [tasks]);

  const undo = useCallback(() => {
    if (history.length === 0) return;
    setFuture(p => [...p, JSON.parse(JSON.stringify(tasks))]);
    const prev = history[history.length - 1];
    setHistory(p => p.slice(0, -1));
    setTasks(prev);
    addToast('Undone', '#dcdcaa');
  }, [history, tasks, addToast]);

  const redo = useCallback(() => {
    if (future.length === 0) return;
    setHistory(p => [...p, JSON.parse(JSON.stringify(tasks))]);
    const next = future[future.length - 1];
    setFuture(p => p.slice(0, -1));
    setTasks(next);
    addToast('Redone', '#dcdcaa');
  }, [future, tasks, addToast]);

  const updateTask = useCallback((id: string, u: Partial<Task>) => {
    pushHistory();
    setTasks(p => p.map(t => t.id === id ? { ...t, ...u } : t));
    setSel(p => p && p.id === id ? { ...p, ...u } : p);
  }, [pushHistory]);

  const deleteTask = useCallback((id: string) => {
    pushHistory();
    setTasks(p => p.filter(t => t.id !== id));
    addToast('Task deleted', '#f44747');
  }, [pushHistory, addToast]);

  const addTask = useCallback((task: Task) => {
    pushHistory();
    setTasks(p => [...p, task]);
  }, [pushHistory]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT')) return;
      if (e.key === 'n' || e.key === 'N') { e.preventDefault(); setNewTask('todo'); }
      if (e.key === '/') { e.preventDefault(); searchRef.current?.focus(); }
      if (e.key === 'Escape') { setSel(null); setShowStats(false); setNewTask(null); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) { e.preventDefault(); redo(); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') { e.preventDefault(); redo(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [undo, redo]);

  const hasFilters = !!(memberF.length || tagF.length || prioF.length || search);

  return (
    <div style={{ fontFamily: "'Cascadia Code','Fira Code','Segoe UI',monospace", background: '#1e1e1e', color: '#d4d4d4', height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', userSelect: 'none' }}>
      <style>{`
        * { box-sizing: border-box; }
        @keyframes slideIn{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}
        ::-webkit-scrollbar{width:8px;height:8px}
        ::-webkit-scrollbar-track{background:#1e1e1e}
        ::-webkit-scrollbar-thumb{background:#3c3c3c;border-radius:4px}
        ::-webkit-scrollbar-thumb:hover{background:#555}
        ::selection{background:#007acc44}
        body{margin:0;padding:0}
      `}</style>

      {/* TOP BAR */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0 20px', height: 56, background: '#252526', borderBottom: '1px solid #3c3c3c', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 16, height: 16, borderRadius: 3, background: 'linear-gradient(135deg,#007acc,#0098ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ fontSize: 11, fontWeight: 900, color: '#fff', lineHeight: 1 }}>K</span>
          </div>
          <span style={{ fontSize: 15, fontWeight: 600, color: '#d4d4d4', letterSpacing: '-.02em', lineHeight: 1 }}>Kezban</span>
          <div style={{ width: 3, height: 3, borderRadius: '50%', background: '#444', margin: '0 2px' }} />
          <span style={{ fontSize: 11, color: '#666', fontWeight: 800, letterSpacing: '.05em', lineHeight: 1, marginTop: 1 }}>K11C0</span>
        </div>

        <div style={{ width: 1, height: 20, background: '#3c3c3c', margin: '0 4px' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#1e1e1e', borderRadius: 4, padding: '4px 10px', border: '1px solid #3c3c3c', width: 180 }}>
          <I.Search />
          <input ref={searchRef} value={search} onChange={e => setSearch(e.target.value)} placeholder="Search... ( / )" style={{ background: 'transparent', border: 'none', outline: 'none', color: '#ccc', fontSize: 13, fontFamily: 'inherit', width: '100%' }} />
          {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', padding: 0 }}><I.X /></button>}
        </div>

        <button onClick={() => setShowFilters(!showFilters)} style={{ display: 'flex', alignItems: 'center', gap: 4, background: hasFilters ? '#007acc22' : '#2d2d2d', border: `1px solid ${hasFilters ? '#007acc' : '#3c3c3c'}`, borderRadius: 4, padding: '4px 10px', color: hasFilters ? '#007acc' : '#999', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
          <I.Filter /> Filters {hasFilters && <span style={{ background: '#007acc', color: '#fff', fontSize: 11, padding: '0 5px', borderRadius: 6, fontWeight: 700 }}>{memberF.length + tagF.length + prioF.length + (search ? 1 : 0)}</span>}
        </button>

        <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <button onClick={() => setZoom('day')} style={{ background: zoom === 'day' ? '#007acc' : '#2d2d2d', border: 'none', borderRadius: '3px 0 0 3px', padding: '4px 8px', color: zoom === 'day' ? '#fff' : '#888', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>Day</button>
          <button onClick={() => setZoom('week')} style={{ background: zoom === 'week' ? '#007acc' : '#2d2d2d', border: 'none', borderRadius: 0, padding: '4px 8px', color: zoom === 'week' ? '#fff' : '#888', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>Week</button>
          <button onClick={() => setZoom('month')} style={{ background: zoom === 'month' ? '#007acc' : '#2d2d2d', border: 'none', borderRadius: '0 3px 3px 0', padding: '4px 8px', color: zoom === 'month' ? '#fff' : '#888', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>Month</button>
        </div>

        <div style={{ display: 'flex', gap: 2 }}>
          <button onClick={undo} disabled={history.length === 0} style={{ background: '#2d2d2d', border: 'none', borderRadius: 3, padding: '4px 6px', color: history.length > 0 ? '#ccc' : '#555', cursor: history.length > 0 ? 'pointer' : 'default', opacity: history.length > 0 ? 1 : .4 }} title="Undo (Ctrl+Z)"><I.Undo /></button>
          <button onClick={redo} disabled={future.length === 0} style={{ background: '#2d2d2d', border: 'none', borderRadius: 3, padding: '4px 6px', color: future.length > 0 ? '#ccc' : '#555', cursor: future.length > 0 ? 'pointer' : 'default', opacity: future.length > 0 ? 1 : .4 }} title="Redo (Ctrl+Shift+Z)"><I.Redo /></button>
        </div>

        <div style={{ flex: 1 }} />

        <div style={{ display: 'flex', alignItems: 'center' }}>
          {MEMBERS.map((m, i) => {
            const isSel = memberF.includes(m);
            return (
              <div key={m} style={{ marginLeft: i > 0 ? -5 : 0, zIndex: MEMBERS.length - i, cursor: 'pointer', transition: 'transform .15s', border: isSel ? '2px solid #007acc' : '2px solid transparent', borderRadius: '50%', background: '#252526' }}
                onClick={() => setMemberF(p => p.includes(m) ? p.filter(x => x !== m) : [...p, m])}
                onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)')}
                onMouseLeave={e => (e.currentTarget.style.transform = '')} title={m}>
                <Av name={m} size={24} />
              </div>
            );
          })}
        </div>

        <div style={{ width: 1, height: 20, background: '#3c3c3c', margin: '0 2px' }} />

        <button onClick={() => exportCSV(tasks)} style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#2d2d2d', border: '1px solid #3c3c3c', borderRadius: 4, padding: '4px 8px', color: '#ccc', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }} title="Export CSV"><I.DL />CSV</button>
        <button onClick={() => exportPDF(tasks)} style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#2d2d2d', border: '1px solid #3c3c3c', borderRadius: 4, padding: '4px 8px', color: '#ccc', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }} title="Export PDF"><I.DL />PDF</button>

        <button onClick={() => setShowStats(true)} style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#2d2d2d', border: '1px solid #3c3c3c', borderRadius: 4, padding: '4px 10px', color: '#ccc', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500 }}><I.Chart />Stats</button>
        <button onClick={() => setNewTask('todo')} style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#007acc', border: 'none', borderRadius: 4, padding: '4px 12px', color: '#fff', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500 }}><I.Plus />New <I.Kbd>N</I.Kbd></button>
      </div>

      {/* FILTER BAR */}
      {showFilters && <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 16, padding: '10px 20px', background: '#1e1e1e', borderBottom: '1px solid #2d2d2d', flexShrink: 0, animation: 'slideIn .15s ease' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, color: '#666', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em' }}>Members:</span>
          <div style={{ display: 'flex', gap: 4 }}>
            {MEMBERS.map(m => {
              const sel = memberF.includes(m);
              return <button key={m} onClick={() => setMemberF(p => sel ? p.filter(x => x !== m) : [...p, m])} style={{ background: sel ? '#007acc22' : '#252526', border: `1px solid ${sel ? '#007acc' : '#3c3c3c'}`, borderRadius: 12, padding: '2px 8px', color: sel ? '#007acc' : '#888', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Av name={m} size={14} /> {m}
              </button>
            })}
          </div>
        </div>

        <div style={{ width: 1, height: 16, background: '#333' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, color: '#666', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em' }}>Tags:</span>
          <div style={{ display: 'flex', gap: 4 }}>
            {TAGS.map(t => {
              const sel = tagF.includes(t);
              return <button key={t} onClick={() => setTagF(p => sel ? p.filter(x => x !== t) : [...p, t])} style={{ background: sel ? '#007acc22' : '#252526', border: `1px solid ${sel ? '#007acc' : '#3c3c3c'}`, borderRadius: 4, padding: '2px 8px', color: sel ? '#007acc' : '#888', fontSize: 11, cursor: 'pointer' }}>
                {t}
              </button>
            })}
          </div>
        </div>

        <div style={{ width: 1, height: 16, background: '#333' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, color: '#666', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em' }}>Priority:</span>
          <div style={{ display: 'flex', gap: 4 }}>
            {PRIORITIES.map(p => {
              const sel = prioF.includes(p);
              return <button key={p} onClick={() => setPrioF(prio => sel ? prio.filter(x => x !== p) : [...prio, p])} style={{ background: sel ? '#007acc22' : '#252526', border: `1px solid ${sel ? '#007acc' : '#3c3c3c'}`, borderRadius: 4, padding: '2px 8px', color: sel ? '#007acc' : '#888', fontSize: 11, cursor: 'pointer' }}>
                {p}
              </button>
            })}
          </div>
        </div>

        {hasFilters && <button onClick={() => { setMemberF([]); setTagF([]); setPrioF([]); setSearch(''); }} style={{ background: '#f4474722', color: '#f44747', border: 'none', borderRadius: 3, padding: '4px 10px', fontSize: 11, cursor: 'pointer', fontWeight: 600, marginLeft: 'auto' }}>Clear All</button>}
      </div>}

      {/* BOARD */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <CardCol title="TO DO" status="todo" tasks={tasks} color="#dcdcaa" collapsed={colC.todo} onToggle={() => setColC(p => ({ ...p, todo: !p.todo }))} onTaskClick={setSel} onUpdate={updateTask} onDelete={deleteTask} searchFilter={search} memberFilter={memberF} tagFilter={tagF} priorityFilter={prioF} onNewTask={setNewTask} toast={addToast} />

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRight: '1px solid #2d2d2d', overflow: 'hidden', transition: 'background 0.2s', background: isGanttOver ? '#007acc15' : 'transparent', border: isGanttOver ? '2px dashed #007acc' : '1px solid #2d2d2d', margin: isGanttOver ? '0 2px 2px 2px' : 0, borderRadius: isGanttOver ? 8 : 0 }}
          onDragOver={e => e.preventDefault()}
          onDragEnter={(e) => { e.preventDefault(); ganttDragCounter.current++; setIsGanttOver(true); }}
          onDragLeave={() => { ganttDragCounter.current--; if (ganttDragCounter.current === 0) setIsGanttOver(false); }}
          onDrop={e => { e.preventDefault(); setIsGanttOver(false); ganttDragCounter.current = 0; const tid = e.dataTransfer.getData('tid'); if (!tid) return; const endD = fmt(addD(today, 5)); updateTask(tid, { status: 'inprogress', ganttStart: fmt(today), ganttEnd: endD, deadline: endD, completedDate: undefined }); addToast('Moved to In Progress', '#007acc'); }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 14px', height: 48, background: '#252526', borderBottom: '1px solid #2d2d2d', flexShrink: 0, boxSizing: 'border-box', cursor: 'pointer' }} onClick={() => setColC(p => ({ ...p, ip: !p.ip }))}>
            <I.Chev open={!colC.ip} s={12} />
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#007acc' }} />
            <span style={{ fontSize: 14, fontWeight: 600, color: '#d4d4d4' }}>IN PROGRESS</span>
            <span style={{ fontSize: 12, color: '#666' }}>— Gantt View</span>
            <span style={{ fontSize: 13, color: '#888', background: '#2d2d2d', padding: '1px 8px', borderRadius: 8, fontWeight: 600, marginLeft: 'auto' }}>{tasks.filter(t => t.status === 'inprogress').length}</span>
            <button onClick={e => { e.stopPropagation(); setNewTask('inprogress'); }} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', padding: 2 }}><I.Plus /></button>
          </div>
          {!colC.ip ? <Gantt tasks={tasks} onTaskClick={setSel} onUpdate={updateTask} searchFilter={search} memberFilter={memberF} tagFilter={tagF} priorityFilter={prioF} zoom={zoom} />
            : <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#444', fontSize: 14 }}>Gantt collapsed — click header to expand</div>}
        </div>

        <CardCol title="COMPLETED" status="completed" tasks={tasks} color="#4ec9b0" collapsed={colC.completed} onToggle={() => setColC(p => ({ ...p, completed: !p.completed }))} onTaskClick={setSel} onUpdate={updateTask} onDelete={deleteTask} searchFilter={search} memberFilter={memberF} tagFilter={tagF} priorityFilter={prioF} onNewTask={setNewTask} toast={addToast} />
      </div>

      {/* STATUS BAR */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0 12px', height: 22, background: '#007acc', flexShrink: 0, fontSize: 12, color: '#fff' }}>
        <span>Tasks: {tasks.length}</span>
        <span>Todo: {tasks.filter(t => t.status === 'todo').length}</span>
        <span>Active: {tasks.filter(t => t.status === 'inprogress').length}</span>
        <span>Done: {tasks.filter(t => t.status === 'completed').length}</span>
        <span style={{ color: '#fff8', fontSize: 11 }}>N: new · /: search · Ctrl+Z/Y: undo/redo · Esc: close</span>
        <span style={{ marginLeft: 'auto' }}>{tasks.filter(t => t.status !== 'completed' && t.deadline && parse(t.deadline)! < today).length} overdue</span>
        <span>{fmt(today)}</span>
      </div>

      {/* MODALS */}
      {sel && <TaskModal task={sel} onClose={() => setSel(null)} onUpdate={updateTask} onDelete={deleteTask} allTasks={tasks} toast={addToast} />}
      {newTask && <NewTaskModal defaultStatus={newTask} onClose={() => setNewTask(null)} onAdd={addTask} toast={addToast} />}
      {showStats && <StatsPanel tasks={tasks} onClose={() => setShowStats(false)} />}

      {/* TOASTS */}
      <ToastContainer toasts={toasts} remove={removeToast} />
    </div>
  );
}
