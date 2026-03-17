import { useState, useRef, useCallback, useEffect } from "react";
import type { Task, Toast } from "./types.ts";
import { MEMBERS, PRIORITIES, TAGS, MC, PC, fmt, today, addD, parse, initTasks } from "./constants.ts";
import { I, Av } from "./Icons.tsx";
import { ToastContainer } from "./ToastContainer.tsx";
import { TaskModal } from "./TaskModal.tsx";
import { NewTaskModal } from "./NewTaskModal.tsx";
import { StatsPanel } from "./StatsPanel.tsx";
import { SettingsMenu } from "./SettingsMenu.tsx";
import { Gantt } from "./Gantt.tsx";
import { CardCol } from "./CardCol.tsx";
import { exportCSV, exportPDF, exportMarkdown } from "./exportUtils.ts";

export default function App() {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => (localStorage.getItem('theme') as 'dark' | 'light') || 'dark');
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
  const [showArrows, setShowArrows] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [history, setHistory] = useState<Task[][]>([]);
  const [future, setFuture] = useState<Task[][]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [isGanttOver, setIsGanttOver] = useState(false);
  const ganttDragCounter = useRef(0);
  const searchRef = useRef<HTMLInputElement>(null);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const confettiCanvas = useRef<HTMLCanvasElement>(null);

  const addToast = useCallback((msg: string, color = '#007acc') => {
    const id = Date.now();
    setToasts(p => [...p, { id, msg, color }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3000);
  }, []);

  const fireConfetti = useCallback(() => {
    const canvas = confettiCanvas.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const pieces: any[] = [];
    const colors = ['#007acc', '#4ec9b0', '#c586c0', '#dcdcaa', '#f44747'];
    for (let i = 0; i < 100; i++) {
      pieces.push({
        x: Math.random() * canvas.width,
        y: canvas.height + Math.random() * 100,
        r: Math.random() * 6 + 4,
        d: Math.random() * 10 + 10,
        color: colors[Math.floor(Math.random() * colors.length)],
        tilt: Math.random() * 10 - 10,
        tiltAngleIncremental: Math.random() * 0.07 + 0.05,
        tiltAngle: 0
      });
    }
    let animationId: number;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      pieces.forEach((p, i) => {
        p.tiltAngle += p.tiltAngleIncremental;
        p.y -= (Math.cos(p.d) + 3 + p.r / 2) / 2;
        p.x += Math.sin(p.d);
        p.tilt = Math.sin(p.tiltAngle) * 15;
        if (p.y < -20) {
          pieces[i].y = canvas.height + 20;
          pieces[i].x = Math.random() * canvas.width;
        }
        ctx.beginPath();
        ctx.lineWidth = p.r;
        ctx.strokeStyle = p.color;
        ctx.moveTo(p.x + p.tilt + p.r / 4, p.y);
        ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 4);
        ctx.stroke();
      });
      animationId = requestAnimationFrame(draw);
    };
    draw();
    setTimeout(() => {
      cancelAnimationFrame(animationId);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }, 2500);
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

  const updateTask = useCallback((id: string, u: Partial<Task>, skipHistory = false) => {
    if (!skipHistory) {
      pushHistory();
    }
    setTasks(p => p.map(t => {
      if (t.id === id) {
        if (u.status === 'completed' && t.status !== 'completed') fireConfetti();
        return { ...t, ...u };
      }
      return t;
    }));
    setSel(p => p && p.id === id ? { ...p, ...u } : p);
  }, [pushHistory, fireConfetti]);

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
      if (e.key === '?' || (e.shiftKey && e.key === '/')) { e.preventDefault(); setShowShortcuts(p => !p); }
      if (e.key === 'Escape') { setSel(null); setShowStats(false); setNewTask(null); setShowShortcuts(false); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) { e.preventDefault(); redo(); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') { e.preventDefault(); redo(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [undo, redo]);

  useEffect(() => {
    localStorage.setItem('theme', theme);
  }, [theme]);

  const hasFilters = !!(memberF.length || tagF.length || prioF.length || search);

  return (
    <div style={{ background: 'var(--bg)', color: 'var(--text-main)', height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', userSelect: 'none' }}>
      <style>{`
        :root {
          --bg: ${theme === 'dark' ? '#1e1e1e' : '#ffffff'};
          --bg-alt: ${theme === 'dark' ? '#252526' : '#f8f8f8'};
          --bg-card: ${theme === 'dark' ? '#252526' : '#ffffff'};
          --bg-input: ${theme === 'dark' ? '#1e1e1e' : '#ffffff'};
          --border: ${theme === 'dark' ? '#3c3c3c' : '#e0e0e0'};
          --border-subtle: ${theme === 'dark' ? '#2d2d2d' : '#f0f0f0'};
          --text-main: ${theme === 'dark' ? '#d4d4d4' : '#222222'};
          --text-dim: ${theme === 'dark' ? '#999999' : '#555555'};
          --text-subtle: ${theme === 'dark' ? '#666666' : '#999999'};
          --accent: #007acc;
          --accent-purple: ${theme === 'dark' ? '#c586c0' : '#8a2be2'};
          --hover: ${theme === 'dark' ? '#2d2d2d' : '#f0f0f0'};
          --scroll-track: ${theme === 'dark' ? '#1e1e1e' : '#f0f0f0'};
          --scroll-thumb: ${theme === 'dark' ? '#3c3c3c' : '#ccc'};
          --popover-bg: ${theme === 'dark' ? '#1e1e1e' : '#ffffff'};
          --kbd-bg: ${theme === 'dark' ? '#2d2d2d' : '#f3f3f3'};
          --kbd-border: ${theme === 'dark' ? '#444' : '#ddd'};
          --shadow: ${theme === 'dark' ? '0 10px 30px rgba(0,0,0,.6)' : '0 10px 30px rgba(0,0,0,.15)'};
          
          /* Priority Colors - Darker/Saturation for better readability */
          --prio-critical: ${theme === 'dark' ? '#ff4d4d' : '#be1100'};
          --prio-high: ${theme === 'dark' ? '#ffa500' : '#d9534f'};
          --prio-medium: ${theme === 'dark' ? '#e0af61' : '#8a6d3b'};
          --prio-low: ${theme === 'dark' ? '#73d216' : '#3c763d'};

          /* Tag Colors Base */
          --tag-bg: ${theme === 'dark' ? '#2d2d2d' : '#f0f0f0'};

          /* Member Colors */
          --member-murat: ${theme === 'dark' ? '#569cd6' : '#005a9e'};
          --member-onur: ${theme === 'dark' ? '#4ec9b0' : '#00a285'};
          --member-mustafa: ${theme === 'dark' ? '#ce9178' : '#a34e2b'};
          --member-enes: ${theme === 'dark' ? '#dcdcaa' : '#8c8c1c'};
          --member-berk: ${theme === 'dark' ? '#c586c0' : '#822e82'};
          --member-inan: ${theme === 'dark' ? '#9cdcfe' : '#0078d4'};
          --member-fatih: ${theme === 'dark' ? '#d7ba7d' : '#9a7d3c'};
          --member-muratcan: ${theme === 'dark' ? '#b5cea8' : '#5e7d4d'};
          --member-unassigned: #888888;

          /* Tag Specific Colors (BG and Text) */
          --tag-atak-bg: ${theme === 'dark' ? '#264f78' : '#e8f0f8'};
          --tag-atak-text: ${theme === 'dark' ? '#fff' : '#264f78'};

          --tag-gokbey-bg: ${theme === 'dark' ? '#4d3d1a' : '#f8f4e8'};
          --tag-gokbey-text: ${theme === 'dark' ? '#fff' : '#4d3d1a'};

          --tag-onton-bg: ${theme === 'dark' ? '#3d2d4d' : '#f4ebf8'};
          --tag-onton-text: ${theme === 'dark' ? '#fff' : '#3d2d4d'};

          --tag-kiha-bg: ${theme === 'dark' ? '#2d4d3d' : '#e8f8f0'};
          --tag-kiha-text: ${theme === 'dark' ? '#fff' : '#2d4d3d'};

          --tag-evtol-bg: ${theme === 'dark' ? '#4d2d2d' : '#f8e8e8'};
          --tag-evtol-text: ${theme === 'dark' ? '#fff' : '#4d2d2d'};

          --tag-ucton-bg: ${theme === 'dark' ? '#2d3d4d' : '#e8f0f8'};
          --tag-ucton-text: ${theme === 'dark' ? '#fff' : '#2d3d4d'};

          --tag-infra-bg: ${theme === 'dark' ? '#5c2020' : '#fcecec'};
          --tag-infra-text: ${theme === 'dark' ? '#fff' : '#5c2020'};
        }
        * { box-sizing: border-box; }
        body { 
          margin: 0; 
          padding: 0; 
          font-family: 'Cascadia Code', 'Fira Code', 'Segoe UI', monospace;
        }
        button, input, select, textarea {
          font-family: inherit;
        }
        @keyframes slideIn{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}
        ::-webkit-scrollbar{width:8px;height:8px}
        ::-webkit-scrollbar-track{background:var(--scroll-track)}
        ::-webkit-scrollbar-thumb{background:var(--scroll-thumb);border-radius:4px}
        ::-webkit-scrollbar-thumb:hover{background:var(--accent)}
        ::selection{background:#007acc44}
        body{margin:0;padding:0}
        
        [data-tooltip] { position: relative; }
        [data-tooltip]:after {
          content: attr(data-tooltip);
          position: absolute; left: 50%; transform: translateX(-50%);
          background: var(--popover-bg); color: var(--text-main); border: 1px solid var(--border);
          padding: 6px 12px; border-radius: 8px; font-size: 11px; font-weight: 600;
          white-space: nowrap; visibility: hidden; opacity: 0; transition: all 0.15s ease-out;
          box-shadow: 0 8px 24px var(--shadow); z-index: 20000;
          pointer-events: none; backdrop-filter: blur(10px);
        }
        /* Top (default) */
        [data-tooltip]:not([data-tooltip-pos]):after, [data-tooltip][data-tooltip-pos="top"]:after { bottom: 105%; }
        [data-tooltip]:not([data-tooltip-pos]):hover:after, [data-tooltip][data-tooltip-pos="top"]:hover:after { visibility: visible; opacity: 1; bottom: 95%; }
        
        /* Bottom */
        [data-tooltip][data-tooltip-pos="bottom"]:after { top: 160%; bottom: auto; }
        [data-tooltip][data-tooltip-pos="bottom"]:hover:after { visibility: visible; opacity: 1; top: 150%; }

        /* Right */
        [data-tooltip][data-tooltip-pos="right"]:after { left: 115%; top: 50%; transform: translateY(-50%); }
        [data-tooltip][data-tooltip-pos="right"]:hover:after { visibility: visible; opacity: 1; left: 105%; }
        
        /* Left */
        [data-tooltip][data-tooltip-pos="left"]:after { right: 115%; left: auto; top: 50%; transform: translateY(-50%); }
        [data-tooltip][data-tooltip-pos="left"]:hover:after { visibility: visible; opacity: 1; right: 105%; }
      `}</style>

      {/* TOP BAR */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0 20px', height: 56, background: 'var(--bg-alt)', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 16, height: 16, borderRadius: 3, background: 'linear-gradient(135deg,#007acc,#0098ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ fontSize: 11, fontWeight: 900, color: '#fff', lineHeight: 1 }}>K</span>
          </div>
          <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-main)', letterSpacing: '-.02em', lineHeight: 1 }}>Kezban</span>
          <div style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--border)', margin: '0 2px' }} />
          <span style={{ fontSize: 11, color: 'var(--text-subtle)', fontWeight: 800, letterSpacing: '.05em', lineHeight: 1, marginTop: 1 }}>K11C0</span>
        </div>

        <div style={{ width: 1, height: 20, background: 'var(--border)', margin: '0 4px' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'var(--bg)', borderRadius: 4, padding: '4px 10px', border: '1px solid var(--border)', width: 180 }}>
          <I.Search />
          <input ref={searchRef} value={search} onChange={e => setSearch(e.target.value)} placeholder="Search... ( / )" style={{ background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-main)', fontSize: 13, fontFamily: 'inherit', width: '100%' }} />
          {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', color: 'var(--text-subtle)', cursor: 'pointer', padding: 0 }}><I.X /></button>}
        </div>

        <button onClick={() => setShowFilters(!showFilters)} style={{ display: 'flex', alignItems: 'center', gap: 4, background: hasFilters ? '#007acc22' : 'var(--hover)', border: `1px solid ${hasFilters ? '#007acc' : 'var(--border)'}`, borderRadius: 4, padding: '4px 10px', color: hasFilters ? '#007acc' : 'var(--text-dim)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
          <I.Filter /> Filters {hasFilters && <span style={{ background: '#007acc', color: '#fff', fontSize: 11, padding: '0 5px', borderRadius: 6, fontWeight: 700 }}>{memberF.length + tagF.length + prioF.length + (search ? 1 : 0)}</span>}
        </button>

        <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <button onClick={() => setZoom('day')} style={{ background: zoom === 'day' ? '#007acc' : 'var(--hover)', border: 'none', borderRadius: '3px 0 0 3px', padding: '4px 8px', color: zoom === 'day' ? '#fff' : 'var(--text-dim)', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>Day</button>
          <button onClick={() => setZoom('week')} style={{ background: zoom === 'week' ? '#007acc' : 'var(--hover)', border: 'none', borderRadius: 0, padding: '4px 8px', color: zoom === 'week' ? '#fff' : 'var(--text-dim)', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>Week</button>
          <button onClick={() => setZoom('month')} style={{ background: zoom === 'month' ? '#007acc' : 'var(--hover)', border: 'none', borderRadius: '0 3px 3px 0', padding: '4px 8px', color: zoom === 'month' ? '#fff' : 'var(--text-dim)', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>Month</button>
        </div>

        <div style={{ display: 'flex', gap: 2 }}>
          <button onClick={undo} disabled={history.length === 0} style={{ background: 'var(--hover)', border: 'none', borderRadius: 3, padding: '4px 6px', color: history.length > 0 ? 'var(--text-main)' : 'var(--text-subtle)', cursor: history.length > 0 ? 'pointer' : 'default', opacity: history.length > 0 ? 1 : .4 }} data-tooltip="Undo (Ctrl+Z)" data-tooltip-pos="bottom"><I.Undo /></button>
          <button onClick={redo} disabled={future.length === 0} style={{ background: 'var(--hover)', border: 'none', borderRadius: 3, padding: '4px 6px', color: future.length > 0 ? 'var(--text-main)' : 'var(--text-subtle)', cursor: future.length > 0 ? 'pointer' : 'default', opacity: history.length > 0 ? 1 : .4 }} data-tooltip="Redo (Ctrl+Shift+Z)" data-tooltip-pos="bottom"><I.Redo /></button>
        </div>

        <div style={{ flex: 1 }} />

        <div style={{ display: 'flex', alignItems: 'center' }}>
          {MEMBERS.map((m, i) => {
            const isSel = memberF.includes(m);
            return (
              <div key={m} style={{ marginLeft: i > 0 ? -5 : 0, zIndex: MEMBERS.length - i, cursor: 'pointer', transition: 'transform .15s', border: isSel ? '2px solid var(--accent)' : '2px solid var(--bg-alt)', borderRadius: '50%', background: 'var(--bg-alt)' }}
                onClick={() => setMemberF(p => p.includes(m) ? p.filter(x => x !== m) : [...p, m])}
                onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)')}
                onMouseLeave={e => (e.currentTarget.style.transform = '')} data-tooltip={m} data-tooltip-pos="bottom">
                <Av name={m} size={24} />
              </div>
            );
          })}
        </div>

        <div style={{ width: 1, height: 20, background: 'var(--border)', margin: '0 2px' }} />

        <button onClick={() => setShowStats(true)} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'var(--hover)', border: '1px solid var(--border)', borderRadius: 4, padding: '4px 10px', color: 'var(--text-main)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500 }}><I.Chart />Stats</button>
        
        <SettingsMenu 
          theme={theme} 
          setTheme={setTheme} 
          showArrows={showArrows} 
          setShowArrows={setShowArrows} 
          onExportCSV={() => exportCSV(tasks)} 
          onExportPDF={() => exportPDF(tasks)}
          onExportMD={() => exportMarkdown('Kanban Workspace', tasks)}
        />

        <button onClick={() => setNewTask('todo')} style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#007acc', border: 'none', borderRadius: 4, padding: '4px 12px', color: '#fff', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500 }}><I.Plus />New <I.Kbd>N</I.Kbd></button>
      </div>

      {/* FILTER BAR */}
      {showFilters && <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 16, padding: '10px 20px', background: 'var(--bg)', borderBottom: '1px solid var(--border-subtle)', flexShrink: 0, animation: 'slideIn .15s ease' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, color: 'var(--text-subtle)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em' }}>Members:</span>
          <div style={{ display: 'flex', gap: 4 }}>
            {MEMBERS.map(m => {
              const sel = memberF.includes(m);
              return <button key={m} onClick={() => setMemberF(p => sel ? p.filter(x => x !== m) : [...p, m])} style={{ background: sel ? '#007acc22' : 'var(--bg-alt)', border: `1px solid ${sel ? '#007acc' : 'var(--border)'}`, borderRadius: 12, padding: '2px 8px', color: sel ? '#007acc' : 'var(--text-dim)', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Av name={m} size={14} /> {m}
              </button>
            })}
          </div>
        </div>

        <div style={{ width: 1, height: 16, background: 'var(--border-subtle)' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, color: 'var(--text-subtle)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em' }}>Tags:</span>
          <div style={{ display: 'flex', gap: 4 }}>
            {TAGS.map(t => {
              const sel = tagF.includes(t);
              return <button key={t} onClick={() => setTagF(p => sel ? p.filter(x => x !== t) : [...p, t])} style={{ background: sel ? '#007acc22' : 'var(--bg-alt)', border: `1px solid ${sel ? '#007acc' : 'var(--border)'}`, borderRadius: 4, padding: '2px 8px', color: sel ? '#007acc' : 'var(--text-dim)', fontSize: 11, cursor: 'pointer' }}>
                {t}
              </button>
            })}
          </div>
        </div>

        <div style={{ width: 1, height: 16, background: 'var(--border-subtle)' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, color: 'var(--text-subtle)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em' }}>Priority:</span>
          <div style={{ display: 'flex', gap: 4 }}>
            {PRIORITIES.map(p => {
              const sel = prioF.includes(p);
              return <button key={p} onClick={() => setPrioF(prio => sel ? prio.filter(x => x !== p) : [...prio, p])} style={{ background: sel ? '#007acc22' : 'var(--bg-alt)', border: `1px solid ${sel ? '#007acc' : 'var(--border)'}`, borderRadius: 4, padding: '2px 8px', color: sel ? '#007acc' : 'var(--text-dim)', fontSize: 11, cursor: 'pointer' }}>
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

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--border-subtle)', overflow: 'hidden', transition: 'background 0.2s', background: isGanttOver ? '#007acc15' : 'transparent', border: isGanttOver ? '2px dashed #007acc' : '1px solid var(--border-subtle)', margin: isGanttOver ? '0 2px 2px 2px' : 0, borderRadius: isGanttOver ? 8 : 0 }}
          onDragOver={e => e.preventDefault()}
          onDragEnter={(e) => { e.preventDefault(); ganttDragCounter.current++; setIsGanttOver(true); }}
          onDragLeave={() => { ganttDragCounter.current--; if (ganttDragCounter.current === 0) setIsGanttOver(false); }}
          onDrop={e => { e.preventDefault(); setIsGanttOver(false); ganttDragCounter.current = 0; const tid = e.dataTransfer.getData('tid'); if (!tid) return; const endD = fmt(addD(today, 5)); updateTask(tid, { status: 'inprogress', ganttStart: fmt(today), ganttEnd: endD, deadline: endD, completedDate: undefined }); addToast('Moved to In Progress', '#007acc'); }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 14px', height: 48, background: 'var(--bg-alt)', borderBottom: '1px solid var(--border-subtle)', flexShrink: 0, boxSizing: 'border-box', cursor: 'pointer' }} onClick={() => setColC(p => ({ ...p, ip: !p.ip }))}>
            <I.Chev open={!colC.ip} s={12} />
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#007acc' }} />
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-main)' }}>IN PROGRESS</span>
            <span style={{ fontSize: 12, color: 'var(--text-subtle)' }}>— Gantt View</span>
            <span style={{ fontSize: 13, color: 'var(--text-dim)', background: 'var(--hover)', padding: '1px 8px', borderRadius: 8, fontWeight: 600, marginLeft: 'auto' }}>{tasks.filter(t => t.status === 'inprogress').length}</span>
            <button onClick={e => { e.stopPropagation(); setNewTask('inprogress'); }} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: 2 }}><I.Plus /></button>
          </div>
          {!colC.ip ? <Gantt 
          tasks={tasks} 
          onTaskClick={setSel} 
          onUpdate={updateTask} 
          searchFilter={search} 
          memberFilter={memberF} 
          tagFilter={tagF} 
          priorityFilter={prioF} 
          zoom={zoom} 
          showArrows={showArrows} 
          onPushHistory={pushHistory}
        />    : <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-subtle)', fontSize: 14 }}>Gantt collapsed — click header to expand</div>}
        </div>

        <CardCol title="COMPLETED" status="completed" tasks={tasks} color="#4ec9b0" collapsed={colC.completed} onToggle={() => setColC(p => ({ ...p, completed: !p.completed }))} onTaskClick={setSel} onUpdate={updateTask} onDelete={deleteTask} searchFilter={search} memberFilter={memberF} tagFilter={tagF} priorityFilter={prioF} onNewTask={setNewTask} toast={addToast} />
      </div>

      {/* STATUS BAR */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0 12px', height: 22, background: '#007acc', flexShrink: 0, fontSize: 12, color: '#fff' }}>
        <span>Tasks: {tasks.length}</span>
        <span>Todo: {tasks.filter(t => t.status === 'todo').length}</span>
        <span>Active: {tasks.filter(t => t.status === 'inprogress').length}</span>
        <span>Done: {tasks.filter(t => t.status === 'completed').length}</span>
        <span style={{ color: '#fff8', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }} onClick={() => setShowShortcuts(true)} data-tooltip="Keyboard Shortcuts" data-tooltip-pos="top">
          <I.Kbd>?</I.Kbd> Shortcuts
        </span>
        <span style={{ marginLeft: 'auto' }}>{tasks.filter(t => t.status !== 'completed' && t.deadline && parse(t.deadline)! < today).length} overdue</span>
        <span>{fmt(today)}</span>
      </div>

      {/* MODALS */}
      {sel && <TaskModal task={sel} onClose={() => setSel(null)} onUpdate={updateTask} onDelete={deleteTask} allTasks={tasks} toast={addToast} />}
      {newTask && <NewTaskModal defaultStatus={newTask} onClose={() => setNewTask(null)} onAdd={addTask} toast={addToast} />}
      {showStats && <StatsPanel tasks={tasks} onClose={() => setShowStats(false)} />}

      {showShortcuts && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(0,0,0,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(5px)' }} onClick={() => setShowShortcuts(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 16, padding: 24, width: 420, boxShadow: 'var(--shadow)', animation: 'scaleIn .2s ease-out' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <I.Kbd>?</I.Kbd>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Keyboard Shortcuts</h2>
              <button onClick={() => setShowShortcuts(false)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--text-subtle)', cursor: 'pointer' }}><I.X /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { k: 'N', d: 'Create new task' },
                { k: '/', d: 'Focus search input' },
                { k: '?', d: 'Show this help overlay' },
                { k: 'Ctrl + Z', d: 'Undo last action' },
                { k: 'Ctrl + Y', d: 'Redo last action' },
                { k: 'Esc', d: 'Close active modal/menu' },
              ].map(s => (
                <div key={s.k} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--bg-alt)', borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontSize: 13, color: 'var(--text-main)', fontWeight: 500 }}>{s.d}</span>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {s.k.split(' + ').map(key => <I.Kbd key={key}>{key}</I.Kbd>)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <canvas ref={confettiCanvas} style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9999 }} />

      {/* TOASTS */}
      <ToastContainer toasts={toasts} remove={removeToast} />
    </div>
  );
}
