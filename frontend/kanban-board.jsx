import React, { useState, useRef, useCallback, useEffect, useMemo, useReducer, Fragment } from "react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip as RTooltip, ResponsiveContainer, Cell, PieChart, Pie, LineChart, Line, CartesianGrid, Legend } from "recharts";

/* ═══════════════════════════════════════════════════════════════════════════
   CONSTANTS & HELPERS
   ═══════════════════════════════════════════════════════════════════════════ */
const MEMBERS = ["Murat","Onur","Mustafa","Enes","Berk","İnan","Fatih","Muratcan"];
const MC = { Murat:"#569cd6", Onur:"#4ec9b0", Mustafa:"#ce9178", Enes:"#dcdcaa", Berk:"#c586c0", "İnan":"#9cdcfe", Fatih:"#d7ba7d", Muratcan:"#b5cea8" };
const PRIORITIES = ["Critical","High","Medium","Low"];
const PC = { Critical:"#f44747", High:"#ff8c00", Medium:"#dcdcaa", Low:"#608b4e" };
const TAGS = ["Frontend","Backend","Design","QA","DevOps","Research","Bug","Feature"];
const TC = { Frontend:"#264f78", Backend:"#4d3d1a", Design:"#3d2d4d", QA:"#2d4d3d", DevOps:"#4d2d2d", Research:"#2d3d4d", Bug:"#5c2020", Feature:"#1e4d1e" };

const ROW_H = 42;
const today = new Date(2026,2,16);
const ganttOrigin = new Date(2026,2,2);
const GANTT_TOTAL_DAYS = 42;

const fmt = d => d?`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`:'';
const parse = s => { if(!s)return null; const [y,m,d]=s.split('-').map(Number); return new Date(y,m-1,d); };
const diffD = (a,b) => Math.round((b-a)/864e5);
const addD = (d,n) => new Date(d.getTime()+n*864e5);

let _id = 200;
const uid = () => `t${_id++}`;
const sid = () => `s${_id++}`;
const coid = () => `c${_id++}`;

const MILESTONES = [
  { date:"2026-03-20", label:"Sprint 12 End", color:"#dcdcaa" },
  { date:"2026-03-27", label:"Beta Release", color:"#c586c0" },
  { date:"2026-04-03", label:"v2.3 Launch", color:"#4ec9b0" },
];

/* ═══════════════════════════════════════════════════════════════════════════
   SAMPLE DATA
   ═══════════════════════════════════════════════════════════════════════════ */
const initTasks = () => [
  { id:uid(),title:"API Authentication Module",desc:"Implement OAuth2 flow with refresh tokens and session management.",assignee:"Onur",priority:"High",tags:["Backend","Feature"],status:"todo",estHours:16,deadline:"2026-03-25",comments:[{id:coid(),author:"Murat",text:"Should we use Keycloak or custom?",ts:"2026-03-14T09:00"}],created:"2026-03-10",subtasks:[{id:sid(),title:"Design auth flow",done:true},{id:sid(),title:"Implement token refresh",done:false},{id:sid(),title:"Write integration tests",done:false}],dependencies:[],progress:33 },
  { id:uid(),title:"Dashboard Wireframes",desc:"Create high-fidelity wireframes for analytics dashboard.",assignee:"Mustafa",priority:"Medium",tags:["Design"],status:"todo",estHours:8,deadline:"2026-03-22",comments:[],created:"2026-03-11",subtasks:[{id:sid(),title:"Research competitors",done:true},{id:sid(),title:"Low-fi sketches",done:true},{id:sid(),title:"High-fi in Figma",done:false}],dependencies:[],progress:66 },
  { id:uid(),title:"CI/CD Pipeline Fix",desc:"Debug and fix the failing deployment pipeline on staging.",assignee:"Berk",priority:"Critical",tags:["DevOps","Bug"],status:"todo",estHours:6,deadline:"2026-03-18",comments:[{id:coid(),author:"Berk",text:"Looks like a Docker layer cache issue.",ts:"2026-03-15T14:30"}],created:"2026-03-13",subtasks:[],dependencies:[],progress:0 },
  { id:uid(),title:"User Profile Page",desc:"Build user profile settings page with avatar upload.",assignee:"Enes",priority:"Medium",tags:["Frontend","Feature"],status:"todo",estHours:12,deadline:"2026-03-28",comments:[],created:"2026-03-12",subtasks:[{id:sid(),title:"Profile form UI",done:false},{id:sid(),title:"Avatar crop/upload",done:false},{id:sid(),title:"API integration",done:false}],dependencies:[],progress:0 },
  { id:uid(),title:"Database Migration Script",desc:"Write migration for new schema changes in v2.3.",assignee:"İnan",priority:"High",tags:["Backend"],status:"inprogress",estHours:10,deadline:"2026-03-24",ganttStart:"2026-03-10",ganttEnd:"2026-03-20",comments:[{id:coid(),author:"İnan",text:"Need to handle legacy user_roles table carefully.",ts:"2026-03-13T11:00"}],created:"2026-03-09",subtasks:[{id:sid(),title:"Schema design",done:true},{id:sid(),title:"Migration script",done:true},{id:sid(),title:"Rollback procedure",done:false},{id:sid(),title:"Data validation",done:false}],dependencies:[],progress:50 },
  { id:uid(),title:"Search Functionality",desc:"Implement full-text search with Elasticsearch integration.",assignee:"Onur",priority:"High",tags:["Backend","Feature"],status:"inprogress",estHours:20,deadline:"2026-03-30",ganttStart:"2026-03-12",ganttEnd:"2026-03-26",comments:[],created:"2026-03-08",subtasks:[{id:sid(),title:"ES cluster setup",done:true},{id:sid(),title:"Indexing pipeline",done:true},{id:sid(),title:"Search API",done:false},{id:sid(),title:"Autocomplete",done:false},{id:sid(),title:"Relevance tuning",done:false}],dependencies:[],progress:40 },
  { id:uid(),title:"Component Library Update",desc:"Update shared component library to latest design system tokens.",assignee:"Fatih",priority:"Medium",tags:["Frontend","Design"],status:"inprogress",estHours:14,deadline:"2026-03-27",ganttStart:"2026-03-09",ganttEnd:"2026-03-22",comments:[],created:"2026-03-07",subtasks:[{id:sid(),title:"Audit current components",done:true},{id:sid(),title:"Update tokens",done:true},{id:sid(),title:"Visual regression tests",done:false}],dependencies:[],progress:66 },
  { id:uid(),title:"Load Testing Suite",desc:"Set up k6 load testing for critical API endpoints.",assignee:"Muratcan",priority:"Medium",tags:["QA","DevOps"],status:"inprogress",estHours:12,deadline:"2026-03-26",ganttStart:"2026-03-11",ganttEnd:"2026-03-23",comments:[{id:coid(),author:"Muratcan",text:"Using k6 cloud for distributed tests.",ts:"2026-03-14T16:00"}],created:"2026-03-10",subtasks:[{id:sid(),title:"Identify endpoints",done:true},{id:sid(),title:"Write test scripts",done:false},{id:sid(),title:"CI integration",done:false}],dependencies:[],progress:33 },
  { id:uid(),title:"Performance Audit",desc:"Run Lighthouse audits and fix critical performance issues.",assignee:"Murat",priority:"High",tags:["Frontend","QA"],status:"inprogress",estHours:8,deadline:"2026-03-22",ganttStart:"2026-03-13",ganttEnd:"2026-03-21",comments:[],created:"2026-03-11",subtasks:[{id:sid(),title:"Run audits",done:true},{id:sid(),title:"Fix CLS issues",done:true},{id:sid(),title:"Optimize images",done:false}],dependencies:[],progress:66 },
  { id:uid(),title:"WebSocket vs SSE Research",desc:"Evaluate real-time communication strategies for notifications.",assignee:"Enes",priority:"Low",tags:["Research"],status:"inprogress",estHours:6,deadline:"2026-03-20",ganttStart:"2026-03-14",ganttEnd:"2026-03-19",comments:[],created:"2026-03-12",subtasks:[{id:sid(),title:"Research document",done:false},{id:sid(),title:"Proof of concept",done:false}],dependencies:[],progress:20 },
  { id:uid(),title:"Email Template System",desc:"Built responsive email templates with MJML.",assignee:"Mustafa",priority:"Medium",tags:["Frontend","Feature"],status:"completed",estHours:10,deadline:"2026-03-15",completedDate:"2026-03-14",comments:[{id:coid(),author:"Mustafa",text:"All templates tested across major email clients.",ts:"2026-03-14T18:00"}],created:"2026-03-05",subtasks:[{id:sid(),title:"Design templates",done:true},{id:sid(),title:"MJML implementation",done:true},{id:sid(),title:"Cross-client testing",done:true}],dependencies:[],progress:100 },
  { id:uid(),title:"API Rate Limiting",desc:"Implement token bucket rate limiting on public endpoints.",assignee:"İnan",priority:"High",tags:["Backend","Feature"],status:"completed",estHours:8,deadline:"2026-03-16",completedDate:"2026-03-15",comments:[],created:"2026-03-06",subtasks:[{id:sid(),title:"Algorithm impl",done:true},{id:sid(),title:"Redis integration",done:true}],dependencies:[],progress:100 },
  { id:uid(),title:"Unit Test Coverage",desc:"Increase test coverage to 80% for core modules.",assignee:"Berk",priority:"Medium",tags:["QA"],status:"completed",estHours:14,deadline:"2026-03-14",completedDate:"2026-03-13",comments:[],created:"2026-03-03",subtasks:[],dependencies:[],progress:100 },
  { id:uid(),title:"Logging Infrastructure",desc:"Set up structured logging with ELK stack.",assignee:"Muratcan",priority:"High",tags:["DevOps"],status:"completed",estHours:12,deadline:"2026-03-12",completedDate:"2026-03-11",comments:[],created:"2026-03-01",subtasks:[],dependencies:[],progress:100 },
  { id:uid(),title:"Notification Service",desc:"Implement push notification service with Firebase.",assignee:"Murat",priority:"Medium",tags:["Backend","Feature"],status:"inprogress",estHours:15,deadline:"2026-03-28",ganttStart:"2026-03-08",ganttEnd:"2026-03-24",comments:[],created:"2026-03-06",subtasks:[{id:sid(),title:"Firebase setup",done:true},{id:sid(),title:"Backend integration",done:true},{id:sid(),title:"Client SDK",done:false},{id:sid(),title:"Testing",done:false}],dependencies:[],progress:50 },
  { id:uid(),title:"Dark Mode Toggle",desc:"Add dark/light theme switching across the app.",assignee:"Fatih",priority:"Low",tags:["Frontend","Design"],status:"completed",estHours:6,deadline:"2026-03-13",completedDate:"2026-03-12",comments:[],created:"2026-03-04",subtasks:[],dependencies:[],progress:100 },
  { id:uid(),title:"Data Export Feature",desc:"Allow users to export reports as CSV and PDF.",assignee:"Murat",priority:"Medium",tags:["Backend","Feature"],status:"todo",estHours:10,deadline:"2026-03-30",comments:[],created:"2026-03-14",subtasks:[{id:sid(),title:"CSV export",done:false},{id:sid(),title:"PDF generation",done:false}],dependencies:[],progress:0 },
  { id:uid(),title:"Mobile Responsive Fixes",desc:"Fix layout issues on mobile viewports for key pages.",assignee:"Fatih",priority:"High",tags:["Frontend","Bug"],status:"todo",estHours:8,deadline:"2026-03-23",comments:[],created:"2026-03-15",subtasks:[],dependencies:[],progress:0 },
  { id:uid(),title:"Redis Cache Layer",desc:"Add Redis caching for frequently accessed queries.",assignee:"İnan",priority:"High",tags:["Backend"],status:"todo",estHours:12,deadline:"2026-03-26",comments:[],created:"2026-03-14",subtasks:[{id:sid(),title:"Cache strategy doc",done:false},{id:sid(),title:"Implementation",done:false},{id:sid(),title:"Cache invalidation",done:false}],dependencies:[],progress:0 },
  { id:uid(),title:"Accessibility Audit",desc:"WCAG 2.1 AA compliance check and fixes.",assignee:"Enes",priority:"Medium",tags:["QA","Frontend"],status:"completed",estHours:10,deadline:"2026-03-15",completedDate:"2026-03-14",comments:[],created:"2026-03-05",subtasks:[],dependencies:[],progress:100 },
  { id:uid(),title:"Berk Sprint Review",desc:"Prepare and present sprint review deck.",assignee:"Berk",priority:"Low",tags:["Research"],status:"inprogress",estHours:4,deadline:"2026-03-20",ganttStart:"2026-03-16",ganttEnd:"2026-03-20",comments:[],created:"2026-03-15",subtasks:[{id:sid(),title:"Gather metrics",done:false},{id:sid(),title:"Create slides",done:false}],dependencies:[],progress:0 },
  { id:uid(),title:"İnan API Documentation",desc:"Write OpenAPI specs for all v2.3 endpoints.",assignee:"İnan",priority:"Medium",tags:["Backend"],status:"inprogress",estHours:8,deadline:"2026-03-25",ganttStart:"2026-03-15",ganttEnd:"2026-03-24",comments:[],created:"2026-03-14",subtasks:[{id:sid(),title:"Auth endpoints",done:true},{id:sid(),title:"CRUD endpoints",done:false},{id:sid(),title:"Search endpoints",done:false}],dependencies:[],progress:33 },
  { id:uid(),title:"Mustafa Icon Set",desc:"Design custom icon set for the application.",assignee:"Mustafa",priority:"Low",tags:["Design"],status:"inprogress",estHours:10,deadline:"2026-03-28",ganttStart:"2026-03-12",ganttEnd:"2026-03-25",comments:[],created:"2026-03-10",subtasks:[{id:sid(),title:"Icon inventory",done:true},{id:sid(),title:"Design system icons",done:false},{id:sid(),title:"Export SVGs",done:false}],dependencies:[],progress:33 },
];

/* ═══════════════════════════════════════════════════════════════════════════
   ICONS
   ═══════════════════════════════════════════════════════════════════════════ */
const I = {
  Chev:({open,s=14})=><svg width={s} height={s} viewBox="0 0 16 16" fill="none" style={{transform:`rotate(${open?90:0}deg)`,transition:'transform .15s'}}><path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  Plus:()=><svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  X:()=><svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  Clock:()=><svg width="12" height="12" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.3"/><path d="M8 5v3.5l2.5 1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  Cal:()=><svg width="12" height="12" viewBox="0 0 16 16" fill="none"><rect x="2" y="3" width="12" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M2 6.5h12M5.5 2v2.5M10.5 2v2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  Chat:()=><svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M2.5 3h11a1 1 0 011 1v7a1 1 0 01-1 1H5l-2.5 2V4a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.3"/></svg>,
  Chart:()=><svg width="14" height="14" viewBox="0 0 16 16" fill="none"><rect x="2" y="8" width="3" height="6" rx=".5" fill="currentColor" opacity=".7"/><rect x="6.5" y="5" width="3" height="9" rx=".5" fill="currentColor" opacity=".85"/><rect x="11" y="2" width="3" height="12" rx=".5" fill="currentColor"/></svg>,
  Send:()=><svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M2 2l12 6-12 6V9l8-1-8-1V2z" fill="currentColor"/></svg>,
  Edit:()=><svg width="11" height="11" viewBox="0 0 16 16" fill="none"><path d="M11.5 1.5l3 3L5 14H2v-3L11.5 1.5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>,
  Trash:()=><svg width="11" height="11" viewBox="0 0 16 16" fill="none"><path d="M3 4h10M5.5 4V2.5h5V4M4.5 4v9.5h7V4" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/></svg>,
  Search:()=><svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.3"/><path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  Filter:()=><svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M2 3h12L9 8.5V13l-2-1V8.5L2 3z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>,
  Undo:()=><svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M4 6l-3 3 3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/><path d="M1 9h9a4 4 0 010 8H6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  Redo:()=><svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M12 6l3 3-3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/><path d="M15 9H6a4 4 0 000 8h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  DL:()=><svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M8 2v8m0 0l-3-3m3 3l3-3M3 13h10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  Link:()=><svg width="11" height="11" viewBox="0 0 16 16" fill="none"><path d="M7 9l2-2m-3 .5L3.5 10A2.5 2.5 0 007 13.5L9.5 11m-3-6L9 2.5A2.5 2.5 0 0112.5 6L10 8.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  Check:()=><svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M3.5 8.5L6.5 11.5 12.5 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  Diamond:({s=10,c="#dcdcaa"})=><svg width={s} height={s} viewBox="0 0 10 10"><rect x="5" y="0" width="7" height="7" rx="1" transform="rotate(45 5 0)" fill={c}/></svg>,
  Kbd:({children})=><span style={{background:'#2d2d2d',border:'1px solid #444',borderRadius:3,padding:'0 5px',fontSize:10,color:'#999',fontFamily:'monospace',lineHeight:'18px',display:'inline-block'}}>{children}</span>,
  ZoomIn:()=><svg width="13" height="13" viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.3"/><path d="M5 7h4M7 5v4M11 11l3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  ZoomOut:()=><svg width="13" height="13" viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.3"/><path d="M5 7h4M11 11l3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
};

const Av = ({name,size=28}) => {
  const c=MC[name]||"#888";
  return <div style={{width:size,height:size,borderRadius:'50%',background:c+'22',border:`1.5px solid ${c}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:size*.36,fontWeight:600,color:c,flexShrink:0,letterSpacing:'-.02em'}}>{name.slice(0,2).toUpperCase()}</div>;
};

/* ═══════════════════════════════════════════════════════════════════════════
   TOAST SYSTEM
   ═══════════════════════════════════════════════════════════════════════════ */
const ToastContainer = ({toasts,remove}) => (
  <div style={{position:'fixed',bottom:36,right:16,zIndex:9999,display:'flex',flexDirection:'column-reverse',gap:6,pointerEvents:'none'}}>
    {toasts.map(t=>(
      <div key={t.id} style={{background:'#252526',border:'1px solid #3c3c3c',borderLeft:`3px solid ${t.color||'#007acc'}`,borderRadius:4,padding:'8px 14px',color:'#d4d4d4',fontSize:12,boxShadow:'0 4px 16px rgba(0,0,0,.4)',pointerEvents:'auto',display:'flex',alignItems:'center',gap:8,animation:'slideIn .2s ease',maxWidth:320}}>
        <span style={{flex:1}}>{t.msg}</span>
        <button onClick={()=>remove(t.id)} style={{background:'none',border:'none',color:'#666',cursor:'pointer',padding:0}}><I.X/></button>
      </div>
    ))}
  </div>
);

/* ═══════════════════════════════════════════════════════════════════════════
   CONTEXT MENU
   ═══════════════════════════════════════════════════════════════════════════ */
const CtxMenu = ({x,y,items,onClose}) => {
  const ref = useRef();
  useEffect(()=>{
    const h=e=>{if(ref.current&&!ref.current.contains(e.target))onClose();};
    document.addEventListener('mousedown',h);
    return()=>document.removeEventListener('mousedown',h);
  },[onClose]);
  const adjX = Math.min(x, window.innerWidth-200);
  const adjY = Math.min(y, window.innerHeight-items.length*32-20);
  return(
    <div ref={ref} style={{position:'fixed',left:adjX,top:adjY,background:'#252526',border:'1px solid #3c3c3c',borderRadius:4,padding:'4px 0',zIndex:10000,boxShadow:'0 6px 24px rgba(0,0,0,.5)',minWidth:180}}>
      {items.map((it,i)=> it.divider ? <div key={i} style={{height:1,background:'#3c3c3c',margin:'4px 0'}}/> : (
        <button key={i} onClick={()=>{it.action();onClose();}} style={{display:'flex',alignItems:'center',gap:8,width:'100%',padding:'6px 14px',background:'none',border:'none',color:it.danger?'#f44747':'#ccc',fontSize:12,cursor:'pointer',textAlign:'left',fontFamily:'inherit'}}
          onMouseEnter={e=>e.currentTarget.style.background='#2d2d2d'}
          onMouseLeave={e=>e.currentTarget.style.background='none'}>
          {it.icon&&<span style={{opacity:.6}}>{it.icon}</span>}
          <span style={{flex:1}}>{it.label}</span>
          {it.shortcut&&<I.Kbd>{it.shortcut}</I.Kbd>}
        </button>
      ))}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   GANTT TOOLTIP
   ═══════════════════════════════════════════════════════════════════════════ */
const GanttTip = ({task,x,y}) => {
  if(!task)return null;
  const overdue = task.deadline && task.status!=='completed' && parse(task.deadline)<today;
  return(
    <div style={{position:'fixed',left:x+12,top:y-8,background:'#1e1e1e',border:'1px solid #3c3c3c',borderRadius:6,padding:'10px 14px',zIndex:9000,boxShadow:'0 8px 24px rgba(0,0,0,.5)',maxWidth:280,pointerEvents:'none'}}>
      <div style={{fontSize:12,fontWeight:600,color:'#d4d4d4',marginBottom:6}}>{task.title}</div>
      <div style={{display:'flex',flexDirection:'column',gap:3,fontSize:11,color:'#999'}}>
        <span><span style={{color:PC[task.priority]}}>●</span> {task.priority} · {task.assignee}</span>
        {task.ganttStart&&<span>📅 {task.ganttStart} → {task.ganttEnd}</span>}
        <span>⏱ {task.estHours}h estimated</span>
        <span>Deadline: <span style={{color:overdue?'#f44747':'#999'}}>{task.deadline}{overdue?' (OVERDUE)':''}</span></span>
        {/* Progress bar */}
        <div style={{display:'flex',alignItems:'center',gap:6,marginTop:2}}>
          <div style={{flex:1,height:4,borderRadius:2,background:'#333'}}>
            <div style={{width:`${task.progress||0}%`,height:'100%',borderRadius:2,background:MC[task.assignee],transition:'width .2s'}}/>
          </div>
          <span style={{fontSize:10,color:MC[task.assignee]}}>{task.progress||0}%</span>
        </div>
        {task.subtasks?.length>0&&<span style={{fontSize:10}}>{task.subtasks.filter(s=>s.done).length}/{task.subtasks.length} subtasks</span>}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   TASK MODAL
   ═══════════════════════════════════════════════════════════════════════════ */
const TaskModal = ({task,onClose,onUpdate,onDelete,allTasks,toast}) => {
  const [tab,setTab]=useState('details');
  const [ef,setEf]=useState(null);
  const [ev,setEv]=useState('');
  const [ct,setCt]=useState('');
  const [showMentions,setShowMentions]=useState(false);
  const ref=useRef();
  const inputRef=useRef();

  useEffect(()=>{
    const h=e=>{if(ref.current&&!ref.current.contains(e.target))onClose();};
    document.addEventListener('mousedown',h);
    return()=>document.removeEventListener('mousedown',h);
  },[onClose]);

  if(!task)return null;

  const startE=(f,v)=>{setEf(f);setEv(v||'');};
  const saveE=f=>{
    const val=f==='estHours'?+ev:ev;
    onUpdate(task.id,{[f]:val});
    setEf(null);
    toast('Field updated','#4ec9b0');
  };

  const addComment=()=>{
    if(!ct.trim())return;
    const nc=[...(task.comments||[]),{id:coid(),author:"Onur",text:ct,ts:new Date().toISOString()}];
    onUpdate(task.id,{comments:nc});
    setCt('');
    toast('Comment added','#007acc');
  };

  const handleCommentInput=(val)=>{
    setCt(val);
    const lastAt=val.lastIndexOf('@');
    if(lastAt>=0 && lastAt===val.length-1){setShowMentions(true);}
    else if(lastAt>=0){
      const after=val.slice(lastAt+1);
      if(!after.includes(' ')&&after.length<15)setShowMentions(true);
      else setShowMentions(false);
    }else setShowMentions(false);
  };

  const insertMention=(name)=>{
    const lastAt=ct.lastIndexOf('@');
    const before=ct.slice(0,lastAt);
    setCt(before+'@'+name+' ');
    setShowMentions(false);
    inputRef.current?.focus();
  };

  const toggleSub=(sId)=>{
    const subs=task.subtasks.map(s=>s.id===sId?{...s,done:!s.done}:s);
    const doneCount=subs.filter(s=>s.done).length;
    const progress=subs.length>0?Math.round(doneCount/subs.length*100):(task.progress||0);
    onUpdate(task.id,{subtasks:subs,progress});
  };

  const addSub=()=>{
    const title=prompt('Subtask title:');
    if(!title?.trim())return;
    const subs=[...(task.subtasks||[]),{id:sid(),title,done:false}];
    const progress=subs.length>0?Math.round(subs.filter(s=>s.done).length/subs.length*100):0;
    onUpdate(task.id,{subtasks:subs,progress});
    toast('Subtask added','#4ec9b0');
  };

  const delSub=(sId)=>{
    const subs=task.subtasks.filter(s=>s.id!==sId);
    const progress=subs.length>0?Math.round(subs.filter(s=>s.done).length/subs.length*100):0;
    onUpdate(task.id,{subtasks:subs,progress});
  };

  const toggleDep=(depId)=>{
    const deps=task.dependencies||[];
    const newDeps=deps.includes(depId)?deps.filter(d=>d!==depId):[...deps,depId];
    onUpdate(task.id,{dependencies:newDeps});
    toast(deps.includes(depId)?'Dependency removed':'Dependency added','#c586c0');
  };

  const ips={background:'#2d2d2d',color:'#ccc',border:'1px solid #007acc',borderRadius:3,padding:'4px 8px',fontSize:12,outline:'none',fontFamily:'inherit'};

  const fieldR=(label,field,value,type='text')=>(
    <div style={{display:'flex',alignItems:'flex-start',padding:'7px 0',borderBottom:'1px solid #2d2d2d',gap:10}}>
      <span style={{width:105,flexShrink:0,color:'#888',fontSize:11,paddingTop:3}}>{label}</span>
      {ef===field?(
        <div style={{display:'flex',gap:6,flex:1,alignItems:'center'}}>
          {type==='sp'?<select value={ev} onChange={e=>setEv(e.target.value)} style={ips}>{PRIORITIES.map(p=><option key={p}>{p}</option>)}</select>
          :type==='sm'?<select value={ev} onChange={e=>setEv(e.target.value)} style={ips}>{MEMBERS.map(m=><option key={m}>{m}</option>)}</select>
          :type==='ta'?<textarea value={ev} onChange={e=>setEv(e.target.value)} rows={3} style={{...ips,flex:1,resize:'vertical'}} autoFocus/>
          :type==='number'?<input type="number" value={ev} onChange={e=>setEv(e.target.value)} style={{...ips,width:80}} autoFocus/>
          :<input type={type} value={ev} onChange={e=>setEv(e.target.value)} style={{...ips,flex:1}} autoFocus/>}
          <button onClick={()=>saveE(field)} style={{background:'#007acc',color:'#fff',border:'none',borderRadius:3,padding:'4px 10px',fontSize:11,cursor:'pointer'}}>Save</button>
          <button onClick={()=>setEf(null)} style={{background:'#3c3c3c',color:'#aaa',border:'none',borderRadius:3,padding:'4px 10px',fontSize:11,cursor:'pointer'}}>✕</button>
        </div>
      ):(
        <div style={{flex:1,display:'flex',alignItems:'center',gap:6,cursor:'pointer',minHeight:20}} onClick={()=>startE(field,typeof value==='number'?String(value):value)}>
          {field==='priority'?<span style={{color:PC[value],fontSize:12,fontWeight:600}}>{value}</span>
          :field==='assignee'?<div style={{display:'flex',alignItems:'center',gap:6}}><Av name={value} size={20}/><span style={{color:'#ccc',fontSize:12}}>{value}</span></div>
          :<span style={{color:'#ccc',fontSize:12}}>{value||'—'}</span>}
          <span style={{marginLeft:'auto',opacity:.2}}><I.Edit/></span>
        </div>
      )}
    </div>
  );

  const renderComment=(text)=>{
    const parts=text.split(/(@\w+)/g);
    return parts.map((p,i)=>p.startsWith('@')?<span key={i} style={{color:MC[p.slice(1)]||'#007acc',fontWeight:600}}>{p}</span>:<span key={i}>{p}</span>);
  };

  return(
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.55)',zIndex:5000,display:'flex',alignItems:'center',justifyContent:'center',backdropFilter:'blur(3px)'}}>
      <div ref={ref} style={{background:'#1e1e1e',border:'1px solid #3c3c3c',borderRadius:8,width:680,maxHeight:'88vh',display:'flex',flexDirection:'column',boxShadow:'0 20px 60px rgba(0,0,0,.5)'}}>
        {/* Header */}
        <div style={{padding:'14px 20px',borderBottom:'1px solid #2d2d2d',display:'flex',alignItems:'center',gap:10}}>
          <span style={{color:PC[task.priority],fontSize:9,fontWeight:700,textTransform:'uppercase',letterSpacing:'.08em',background:PC[task.priority]+'18',padding:'3px 8px',borderRadius:3}}>{task.priority}</span>
          <span style={{color:'#d4d4d4',fontSize:14,fontWeight:600,flex:1}}>{task.title}</span>
          <button onClick={()=>{onDelete(task.id);onClose();toast('Task deleted','#f44747');}} style={{background:'none',border:'none',color:'#f44747',cursor:'pointer',padding:4,opacity:.5}} title="Delete"><I.Trash/></button>
          <button onClick={onClose} style={{background:'none',border:'none',color:'#888',cursor:'pointer',padding:4}}><I.X/></button>
        </div>

        {/* Tabs */}
        <div style={{display:'flex',borderBottom:'1px solid #2d2d2d',padding:'0 20px'}}>
          {['details','subtasks','dependencies','comments','activity'].map(t=>(
            <button key={t} onClick={()=>setTab(t)} style={{padding:'9px 14px',background:'none',border:'none',borderBottom:tab===t?'2px solid #007acc':'2px solid transparent',color:tab===t?'#d4d4d4':'#888',fontSize:11,fontWeight:500,cursor:'pointer',textTransform:'capitalize',marginBottom:-1}}>
              {t}{t==='comments'?` (${(task.comments||[]).length})`:t==='subtasks'?` (${(task.subtasks||[]).filter(s=>s.done).length}/${(task.subtasks||[]).length})`:t==='dependencies'?` (${(task.dependencies||[]).length})`:''}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{padding:'14px 20px',overflowY:'auto',flex:1}}>
          {tab==='details'&&<div>
            {fieldR('Title','title',task.title)}
            {fieldR('Description','desc',task.desc,'ta')}
            {fieldR('Assignee','assignee',task.assignee,'sm')}
            {fieldR('Priority','priority',task.priority,'sp')}
            {fieldR('Est. Hours','estHours',task.estHours,'number')}
            {fieldR('Deadline','deadline',task.deadline,'date')}
            {task.status==='inprogress'&&fieldR('Gantt Start','ganttStart',task.ganttStart,'date')}
            {task.status==='inprogress'&&fieldR('Gantt End','ganttEnd',task.ganttEnd,'date')}
            <div style={{padding:'7px 0',display:'flex',alignItems:'flex-start',gap:10}}>
              <span style={{width:105,flexShrink:0,color:'#888',fontSize:11}}>Tags</span>
              <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>{TAGS.map(t=>(
                <button key={t} onClick={()=>{const c=task.tags||[];onUpdate(task.id,{tags:c.includes(t)?c.filter(x=>x!==t):[...c,t]});}} style={{background:(task.tags||[]).includes(t)?TC[t]:'#2d2d2d',color:(task.tags||[]).includes(t)?'#ddd':'#666',border:'1px solid '+((task.tags||[]).includes(t)?'transparent':'#3c3c3c'),fontSize:10,padding:'2px 8px',borderRadius:3,cursor:'pointer'}}>{t}</button>
              ))}</div>
            </div>
            <div style={{padding:'7px 0',display:'flex',alignItems:'center',gap:10}}>
              <span style={{width:105,flexShrink:0,color:'#888',fontSize:11}}>Progress</span>
              <div style={{flex:1,display:'flex',alignItems:'center',gap:8}}>
                <div style={{flex:1,height:6,borderRadius:3,background:'#333'}}>
                  <div style={{width:`${task.progress||0}%`,height:'100%',borderRadius:3,background:MC[task.assignee],transition:'width .2s'}}/>
                </div>
                <span style={{fontSize:11,color:MC[task.assignee],fontWeight:600}}>{task.progress||0}%</span>
              </div>
            </div>
            <div style={{marginTop:8,fontSize:10,color:'#555',display:'flex',gap:12}}>
              <span>Created: {task.created}</span>
              {task.completedDate&&<span>Completed: {task.completedDate}</span>}
              <span>Status: <span style={{color:'#007acc',textTransform:'capitalize'}}>{task.status==='inprogress'?'In Progress':task.status}</span></span>
            </div>
          </div>}

          {tab==='subtasks'&&<div>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
              <span style={{fontSize:12,color:'#999'}}>Track progress with subtasks</span>
              <button onClick={addSub} style={{background:'#007acc',color:'#fff',border:'none',borderRadius:3,padding:'4px 12px',fontSize:11,cursor:'pointer',display:'flex',alignItems:'center',gap:4}}><I.Plus/>Add</button>
            </div>
            {(task.subtasks||[]).length>0&&<div style={{height:4,borderRadius:2,background:'#333',marginBottom:12}}>
              <div style={{width:`${task.progress||0}%`,height:'100%',borderRadius:2,background:MC[task.assignee],transition:'width .3s'}}/>
            </div>}
            {(task.subtasks||[]).map(s=>(
              <div key={s.id} style={{display:'flex',alignItems:'center',gap:8,padding:'7px 0',borderBottom:'1px solid #2d2d2d'}}>
                <div onClick={()=>toggleSub(s.id)} style={{width:18,height:18,borderRadius:3,border:`1.5px solid ${s.done?MC[task.assignee]:'#555'}`,background:s.done?MC[task.assignee]+'22':'transparent',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',flexShrink:0}}>
                  {s.done&&<I.Check/>}
                </div>
                <span style={{flex:1,fontSize:12,color:s.done?'#666':'#ccc',textDecoration:s.done?'line-through':'none'}}>{s.title}</span>
                <button onClick={()=>delSub(s.id)} style={{background:'none',border:'none',color:'#555',cursor:'pointer',padding:2}}><I.Trash/></button>
              </div>
            ))}
            {(task.subtasks||[]).length===0&&<p style={{color:'#444',fontSize:12,textAlign:'center',padding:20}}>No subtasks. Click "Add" to break this task down.</p>}
          </div>}

          {tab==='dependencies'&&<div>
            <p style={{fontSize:12,color:'#999',marginBottom:12}}>Select tasks that must be completed before this one:</p>
            {allTasks.filter(t=>t.id!==task.id&&t.status!=='completed').map(t=>(
              <div key={t.id} onClick={()=>toggleDep(t.id)} style={{display:'flex',alignItems:'center',gap:8,padding:'8px 10px',borderRadius:4,cursor:'pointer',marginBottom:4,background:(task.dependencies||[]).includes(t.id)?'#007acc15':'#252526',border:`1px solid ${(task.dependencies||[]).includes(t.id)?'#007acc44':'#2d2d2d'}`}}>
                <div style={{width:16,height:16,borderRadius:3,border:`1.5px solid ${(task.dependencies||[]).includes(t.id)?'#007acc':'#555'}`,background:(task.dependencies||[]).includes(t.id)?'#007acc22':'transparent',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                  {(task.dependencies||[]).includes(t.id)&&<I.Check/>}
                </div>
                <Av name={t.assignee} size={18}/>
                <span style={{fontSize:12,color:'#ccc',flex:1}}>{t.title}</span>
                <span style={{fontSize:9,color:PC[t.priority],fontWeight:600}}>{t.priority}</span>
              </div>
            ))}
          </div>}

          {tab==='comments'&&<div>
            <div style={{display:'flex',gap:8,marginBottom:14,position:'relative'}}>
              <Av name="Onur" size={28}/>
              <div style={{flex:1,position:'relative'}}>
                <div style={{display:'flex',gap:6}}>
                  <input ref={inputRef} value={ct} onChange={e=>handleCommentInput(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')addComment();}} placeholder="Add a comment... (@ to mention)" style={{flex:1,background:'#2d2d2d',color:'#ccc',border:'1px solid #3c3c3c',borderRadius:4,padding:'7px 10px',fontSize:12,outline:'none',fontFamily:'inherit'}}/>
                  <button onClick={addComment} style={{background:'#007acc',border:'none',borderRadius:4,padding:'7px 10px',cursor:'pointer',color:'#fff'}}><I.Send/></button>
                </div>
                {showMentions&&<div style={{position:'absolute',top:'100%',left:0,background:'#252526',border:'1px solid #3c3c3c',borderRadius:4,padding:4,zIndex:100,boxShadow:'0 4px 12px rgba(0,0,0,.4)',marginTop:4,width:180}}>
                  {MEMBERS.map(m=>(
                    <button key={m} onClick={()=>insertMention(m)} style={{display:'flex',alignItems:'center',gap:6,width:'100%',padding:'5px 8px',background:'none',border:'none',color:'#ccc',fontSize:12,cursor:'pointer',borderRadius:3,fontFamily:'inherit'}} onMouseEnter={e=>e.currentTarget.style.background='#2d2d2d'} onMouseLeave={e=>e.currentTarget.style.background='none'}>
                      <Av name={m} size={18}/>{m}
                    </button>
                  ))}
                </div>}
              </div>
            </div>
            {(task.comments||[]).slice().reverse().map(c=>(
              <div key={c.id} style={{display:'flex',gap:8,padding:'9px 0',borderBottom:'1px solid #2d2d2d'}}>
                <Av name={c.author} size={24}/>
                <div style={{flex:1}}>
                  <div style={{display:'flex',alignItems:'center',gap:8}}>
                    <span style={{color:'#d4d4d4',fontSize:12,fontWeight:600}}>{c.author}</span>
                    <span style={{color:'#555',fontSize:10}}>{new Date(c.ts).toLocaleString()}</span>
                    <button onClick={()=>{onUpdate(task.id,{comments:task.comments.filter(x=>x.id!==c.id)});toast('Comment deleted');}} style={{marginLeft:'auto',background:'none',border:'none',color:'#555',cursor:'pointer',padding:2}}><I.Trash/></button>
                  </div>
                  <p style={{color:'#aaa',fontSize:12,margin:'3px 0 0',lineHeight:1.5}}>{renderComment(c.text)}</p>
                </div>
              </div>
            ))}
            {(task.comments||[]).length===0&&<p style={{color:'#444',fontSize:12,textAlign:'center',padding:20}}>No comments yet.</p>}
          </div>}

          {tab==='activity'&&<div style={{color:'#888',fontSize:12}}>
            {[
              {dot:'#007acc',text:`Task created on ${task.created}`},
              ...(task.status==='inprogress'?[{dot:'#dcdcaa',text:`Moved to In Progress — started ${task.ganttStart}`}]:[]),
              ...(task.status==='completed'?[{dot:'#4ec9b0',text:`Completed on ${task.completedDate}`}]:[]),
              ...(task.dependencies||[]).map(dId=>{const dt=allTasks.find(t=>t.id===dId);return{dot:'#c586c0',text:`Depends on: ${dt?.title||dId}`};}),
              ...(task.comments||[]).map(c=>({dot:MC[c.author]||'#888',text:`${c.author} commented — ${new Date(c.ts).toLocaleString()}`})),
            ].map((e,i)=>(
              <div key={i} style={{display:'flex',alignItems:'center',gap:8,padding:'5px 0'}}>
                <div style={{width:6,height:6,borderRadius:'50%',background:e.dot,flexShrink:0}}/>
                <span>{e.text}</span>
              </div>
            ))}
          </div>}
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   NEW TASK MODAL
   ═══════════════════════════════════════════════════════════════════════════ */
const NewTaskModal = ({onClose,onAdd,defaultStatus,toast:addToast})=>{
  const [f,sF]=useState({title:'',desc:'',assignee:MEMBERS[0],priority:'Medium',tags:[],estHours:8,deadline:fmt(addD(today,7)),status:defaultStatus||'todo'});
  const ref=useRef();
  useEffect(()=>{const h=e=>{if(ref.current&&!ref.current.contains(e.target))onClose();};document.addEventListener('mousedown',h);return()=>document.removeEventListener('mousedown',h);},[onClose]);

  const submit=()=>{
    if(!f.title.trim())return;
    const task={...f,id:uid(),comments:[],created:fmt(today),subtasks:[],dependencies:[],progress:0};
    if(f.status==='inprogress'){task.ganttStart=fmt(today);task.ganttEnd=fmt(addD(today,Math.max(1,Math.ceil(f.estHours/8))));}
    if(f.status==='completed')task.completedDate=fmt(today);
    onAdd(task);onClose();addToast('Task created','#4ec9b0');
  };

  const is={background:'#2d2d2d',color:'#ccc',border:'1px solid #3c3c3c',borderRadius:4,padding:'6px 10px',fontSize:12,outline:'none',fontFamily:'inherit',width:'100%',boxSizing:'border-box'};

  return(
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.55)',zIndex:5000,display:'flex',alignItems:'center',justifyContent:'center',backdropFilter:'blur(3px)'}}>
      <div ref={ref} style={{background:'#1e1e1e',border:'1px solid #3c3c3c',borderRadius:8,width:480,boxShadow:'0 20px 60px rgba(0,0,0,.5)'}}>
        <div style={{padding:'14px 20px',borderBottom:'1px solid #2d2d2d',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <span style={{color:'#d4d4d4',fontSize:14,fontWeight:600}}>New Task</span>
          <button onClick={onClose} style={{background:'none',border:'none',color:'#888',cursor:'pointer'}}><I.X/></button>
        </div>
        <div style={{padding:'14px 20px',display:'flex',flexDirection:'column',gap:10}}>
          <div><label style={{color:'#888',fontSize:10,display:'block',marginBottom:3}}>Title *</label><input value={f.title} onChange={e=>sF({...f,title:e.target.value})} style={is} autoFocus placeholder="Task title"/></div>
          <div><label style={{color:'#888',fontSize:10,display:'block',marginBottom:3}}>Description</label><textarea value={f.desc} onChange={e=>sF({...f,desc:e.target.value})} style={{...is,minHeight:50,resize:'vertical'}} placeholder="Description"/></div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
            <div><label style={{color:'#888',fontSize:10,display:'block',marginBottom:3}}>Assignee</label><select value={f.assignee} onChange={e=>sF({...f,assignee:e.target.value})} style={is}>{MEMBERS.map(m=><option key={m}>{m}</option>)}</select></div>
            <div><label style={{color:'#888',fontSize:10,display:'block',marginBottom:3}}>Priority</label><select value={f.priority} onChange={e=>sF({...f,priority:e.target.value})} style={is}>{PRIORITIES.map(p=><option key={p}>{p}</option>)}</select></div>
            <div><label style={{color:'#888',fontSize:10,display:'block',marginBottom:3}}>Est. Hours</label><input type="number" value={f.estHours} onChange={e=>sF({...f,estHours:+e.target.value})} style={is}/></div>
            <div><label style={{color:'#888',fontSize:10,display:'block',marginBottom:3}}>Deadline</label><input type="date" value={f.deadline} onChange={e=>sF({...f,deadline:e.target.value})} style={is}/></div>
          </div>
          <div><label style={{color:'#888',fontSize:10,display:'block',marginBottom:3}}>Tags</label><div style={{display:'flex',gap:4,flexWrap:'wrap'}}>{TAGS.map(t=><button key={t} onClick={()=>sF({...f,tags:f.tags.includes(t)?f.tags.filter(x=>x!==t):[...f.tags,t]})} style={{background:f.tags.includes(t)?TC[t]:'#2d2d2d',color:f.tags.includes(t)?'#ddd':'#666',border:'1px solid '+(f.tags.includes(t)?'transparent':'#3c3c3c'),fontSize:10,padding:'3px 8px',borderRadius:3,cursor:'pointer'}}>{t}</button>)}</div></div>
          <button onClick={submit} style={{background:'#007acc',color:'#fff',border:'none',borderRadius:4,padding:'8px 16px',fontSize:12,fontWeight:500,cursor:'pointer',marginTop:4}}>Create Task</button>
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   STATS PANEL
   ═══════════════════════════════════════════════════════════════════════════ */
const StatsPanel = ({tasks,onClose})=>{
  const [view,setView]=useState('overview');

  const memberStats=useMemo(()=>MEMBERS.map(m=>{
    const mine=tasks.filter(t=>t.assignee===m);
    const todo=mine.filter(t=>t.status==='todo').length;
    const ip=mine.filter(t=>t.status==='inprogress').length;
    const done=mine.filter(t=>t.status==='completed').length;
    const totalH=mine.reduce((s,t)=>s+(t.estHours||0),0);
    const doneH=mine.filter(t=>t.status==='completed').reduce((s,t)=>s+(t.estHours||0),0);
    const overdue=mine.filter(t=>t.status!=='completed'&&t.deadline&&parse(t.deadline)<today).length;
    const vel=mine.length>0?Math.round(done/mine.length*100):0;
    return{name:m,total:mine.length,todo,ip,done,totalH,doneH,overdue,vel,color:MC[m]};
  }),[tasks]);

  // Burndown data
  const burndown=useMemo(()=>{
    const days=[];
    for(let i=-14;i<=14;i++){
      const d=addD(today,i);
      const total=tasks.filter(t=>parse(t.created)<=d).length;
      const completed=tasks.filter(t=>t.status==='completed'&&t.completedDate&&parse(t.completedDate)<=d).length;
      const remaining=total-completed;
      days.push({date:fmt(d).slice(5),remaining,ideal:Math.max(0,Math.round(tasks.length*(1-(i+14)/28)))});
    }
    return days;
  },[tasks]);

  // Workload heatmap data
  const heatmap=useMemo(()=>{
    const data=[];
    for(let i=0;i<21;i++){
      const d=addD(ganttOrigin,i+7);
      const ds=fmt(d);
      const row={date:ds.slice(5)};
      MEMBERS.forEach(m=>{
        row[m]=tasks.filter(t=>t.status==='inprogress'&&t.ganttStart&&t.ganttEnd&&parse(t.ganttStart)<=d&&parse(t.ganttEnd)>=d&&t.assignee===m).length;
      });
      data.push(row);
    }
    return data;
  },[tasks]);

  // Tag distribution
  const tagDist=useMemo(()=>{
    const map={};
    tasks.forEach(t=>(t.tags||[]).forEach(tag=>{map[tag]=(map[tag]||0)+1;}));
    return Object.entries(map).map(([name,value])=>({name,value})).sort((a,b)=>b.value-a.value);
  },[tasks]);

  const chartColors = ['#569cd6','#4ec9b0','#ce9178','#dcdcaa','#c586c0','#9cdcfe','#d7ba7d','#b5cea8'];

  return(
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.55)',zIndex:5000,display:'flex',alignItems:'center',justifyContent:'center',backdropFilter:'blur(3px)'}}>
      <div style={{background:'#1e1e1e',border:'1px solid #3c3c3c',borderRadius:8,width:900,maxHeight:'90vh',overflow:'auto',boxShadow:'0 20px 60px rgba(0,0,0,.5)'}}>
        <div style={{padding:'14px 20px',borderBottom:'1px solid #2d2d2d',display:'flex',alignItems:'center',gap:12,position:'sticky',top:0,background:'#1e1e1e',zIndex:1}}>
          <I.Chart/>
          <span style={{color:'#d4d4d4',fontSize:14,fontWeight:600,flex:1}}>Team Statistics & Analytics</span>
          <div style={{display:'flex',gap:2}}>
            {['overview','burndown','heatmap','tags'].map(v=>(
              <button key={v} onClick={()=>setView(v)} style={{padding:'4px 12px',borderRadius:3,border:'none',background:view===v?'#007acc':'#2d2d2d',color:view===v?'#fff':'#999',fontSize:11,cursor:'pointer',fontFamily:'inherit',textTransform:'capitalize'}}>{v}</button>
            ))}
          </div>
          <button onClick={onClose} style={{background:'none',border:'none',color:'#888',cursor:'pointer',marginLeft:8}}><I.X/></button>
        </div>

        <div style={{padding:'16px 20px'}}>
          {/* Summary cards always visible */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:16}}>
            {[{l:'Total',v:tasks.length,c:'#569cd6'},{l:'To Do',v:tasks.filter(t=>t.status==='todo').length,c:'#dcdcaa'},{l:'In Progress',v:tasks.filter(t=>t.status==='inprogress').length,c:'#007acc'},{l:'Completed',v:tasks.filter(t=>t.status==='completed').length,c:'#4ec9b0'}].map(s=>(
              <div key={s.l} style={{background:'#252526',borderRadius:6,padding:'12px 14px',border:'1px solid #2d2d2d'}}>
                <div style={{color:'#888',fontSize:9,textTransform:'uppercase',letterSpacing:'.08em'}}>{s.l}</div>
                <div style={{color:s.c,fontSize:24,fontWeight:700,marginTop:2}}>{s.v}</div>
              </div>
            ))}
          </div>

          {view==='overview'&&<div>
            {memberStats.map(s=>(
              <div key={s.name} style={{background:'#252526',borderRadius:6,padding:'12px 14px',marginBottom:6,border:'1px solid #2d2d2d'}}>
                <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:8}}>
                  <Av name={s.name} size={30}/>
                  <div style={{flex:1}}>
                    <div style={{color:'#d4d4d4',fontSize:12,fontWeight:600}}>{s.name}</div>
                    <div style={{color:'#666',fontSize:10}}>{s.total} tasks · {s.totalH}h est · {s.doneH}h done</div>
                  </div>
                  <div style={{textAlign:'right'}}>
                    <div style={{color:s.vel>=60?'#4ec9b0':s.vel>=30?'#dcdcaa':'#f44747',fontSize:18,fontWeight:700}}>{s.vel}%</div>
                    <div style={{color:'#666',fontSize:9,textTransform:'uppercase'}}>Velocity</div>
                  </div>
                  {s.overdue>0&&<div style={{background:'#f4474718',color:'#f44747',fontSize:10,padding:'3px 8px',borderRadius:3,fontWeight:600}}>{s.overdue} overdue</div>}
                </div>
                <div style={{display:'flex',height:6,borderRadius:3,overflow:'hidden',background:'#1e1e1e',gap:1}}>
                  {s.done>0&&<div style={{flex:s.done,background:'#4ec9b0',borderRadius:s.ip===0&&s.todo===0?3:0,borderTopLeftRadius:3,borderBottomLeftRadius:3}}/>}
                  {s.ip>0&&<div style={{flex:s.ip,background:'#007acc'}}/>}
                  {s.todo>0&&<div style={{flex:s.todo,background:'#dcdcaa44',borderTopRightRadius:3,borderBottomRightRadius:3}}/>}
                </div>
                <div style={{display:'flex',gap:14,marginTop:6,fontSize:10,color:'#888'}}>
                  <span><span style={{color:'#4ec9b0'}}>●</span> {s.done}</span>
                  <span><span style={{color:'#007acc'}}>●</span> {s.ip}</span>
                  <span><span style={{color:'#dcdcaa'}}>●</span> {s.todo}</span>
                </div>
              </div>
            ))}
          </div>}

          {view==='burndown'&&<div>
            <h4 style={{color:'#d4d4d4',fontSize:13,fontWeight:600,marginBottom:12}}>Sprint Burndown</h4>
            <div style={{background:'#252526',borderRadius:6,padding:16,border:'1px solid #2d2d2d'}}>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={burndown}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333"/>
                  <XAxis dataKey="date" stroke="#666" fontSize={10} tickLine={false}/>
                  <YAxis stroke="#666" fontSize={10} tickLine={false}/>
                  <RTooltip contentStyle={{background:'#1e1e1e',border:'1px solid #3c3c3c',borderRadius:4,fontSize:11}} itemStyle={{color:'#ccc'}}/>
                  <Area type="monotone" dataKey="ideal" stroke="#555" fill="#55555520" strokeDasharray="5 5" name="Ideal"/>
                  <Area type="monotone" dataKey="remaining" stroke="#007acc" fill="#007acc20" name="Remaining"/>
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <h4 style={{color:'#d4d4d4',fontSize:13,fontWeight:600,margin:'20px 0 12px'}}>Completion Velocity by Member</h4>
            <div style={{background:'#252526',borderRadius:6,padding:16,border:'1px solid #2d2d2d'}}>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={memberStats} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" horizontal={false}/>
                  <XAxis type="number" stroke="#666" fontSize={10} tickLine={false} domain={[0,100]}/>
                  <YAxis dataKey="name" type="category" stroke="#666" fontSize={11} tickLine={false} width={80}/>
                  <RTooltip contentStyle={{background:'#1e1e1e',border:'1px solid #3c3c3c',borderRadius:4,fontSize:11}} formatter={v=>`${v}%`}/>
                  <Bar dataKey="vel" radius={[0,3,3,0]} name="Velocity">
                    {memberStats.map((e,i)=><Cell key={i} fill={e.color}/>)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>}

          {view==='heatmap'&&<div>
            <h4 style={{color:'#d4d4d4',fontSize:13,fontWeight:600,marginBottom:12}}>Workload Heatmap <span style={{color:'#888',fontWeight:400,fontSize:11}}>(active tasks per day)</span></h4>
            <div style={{background:'#252526',borderRadius:6,padding:16,border:'1px solid #2d2d2d',overflowX:'auto'}}>
              <div style={{display:'grid',gridTemplateColumns:`80px repeat(${heatmap.length},1fr)`,gap:2,fontSize:10}}>
                <div/>
                {heatmap.map((d,i)=><div key={i} style={{textAlign:'center',color:'#666',padding:'2px 0'}}>{d.date}</div>)}
                {MEMBERS.map(m=><Fragment key={m}>
                  <div style={{color:MC[m],fontWeight:500,display:'flex',alignItems:'center',gap:4,padding:'2px 4px'}}><Av name={m} size={16}/>{m}</div>
                  {heatmap.map((d,i)=>{
                    const v=d[m]||0;
                    const bg=v===0?'#1e1e1e':v===1?MC[m]+'33':v===2?MC[m]+'66':MC[m]+'aa';
                    return<div key={m+i} style={{background:bg,borderRadius:2,height:24,display:'flex',alignItems:'center',justifyContent:'center',color:v>0?'#fff':'#333',fontSize:9,fontWeight:600}}>{v>0?v:''}</div>;
                  })}
                </Fragment>)}
              </div>
            </div>
          </div>}

          {view==='tags'&&<div>
            <h4 style={{color:'#d4d4d4',fontSize:13,fontWeight:600,marginBottom:12}}>Task Distribution by Tag</h4>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
              <div style={{background:'#252526',borderRadius:6,padding:16,border:'1px solid #2d2d2d'}}>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={tagDist} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={45} strokeWidth={0}>
                      {tagDist.map((e,i)=><Cell key={i} fill={chartColors[i%chartColors.length]}/>)}
                    </Pie>
                    <RTooltip contentStyle={{background:'#1e1e1e',border:'1px solid #3c3c3c',borderRadius:4,fontSize:11}}/>
                    <Legend iconSize={8} wrapperStyle={{fontSize:11,color:'#ccc'}}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{background:'#252526',borderRadius:6,padding:16,border:'1px solid #2d2d2d'}}>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={tagDist}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333"/>
                    <XAxis dataKey="name" stroke="#666" fontSize={10} tickLine={false} angle={-30} textAnchor="end" height={50}/>
                    <YAxis stroke="#666" fontSize={10} tickLine={false}/>
                    <RTooltip contentStyle={{background:'#1e1e1e',border:'1px solid #3c3c3c',borderRadius:4,fontSize:11}}/>
                    <Bar dataKey="value" radius={[3,3,0,0]}>
                      {tagDist.map((e,i)=><Cell key={i} fill={chartColors[i%chartColors.length]}/>)}
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

/* ═══════════════════════════════════════════════════════════════════════════
   GANTT CHART
   ═══════════════════════════════════════════════════════════════════════════ */
const Gantt = ({tasks,onTaskClick,onUpdate,searchFilter,memberFilter,tagFilter,priorityFilter,zoom})=>{
  const [cLanes,setCLanes]=useState({});
  const [drag,setDrag]=useState(null);
  const [tip,setTip]=useState(null);
  const [ctxMenu,setCtxMenu]=useState(null);
  const gRef=useRef();

  const DAY_W = zoom==='week'?20:44;

  const filtered=useMemo(()=>tasks.filter(t=>{
    if(t.status!=='inprogress')return false;
    if(searchFilter&&!t.title.toLowerCase().includes(searchFilter.toLowerCase()))return false;
    if(memberFilter&&t.assignee!==memberFilter)return false;
    if(tagFilter&&!(t.tags||[]).includes(tagFilter))return false;
    if(priorityFilter&&t.priority!==priorityFilter)return false;
    return true;
  }),[tasks,searchFilter,memberFilter,tagFilter,priorityFilter]);

  const mTasks=useMemo(()=>{
    const m={};MEMBERS.forEach(n=>m[n]=[]);
    filtered.forEach(t=>{if(m[t.assignee])m[t.assignee].push(t);});
    return m;
  },[filtered]);

  const dates=useMemo(()=>Array.from({length:GANTT_TOTAL_DAYS},(_,i)=>addD(ganttOrigin,i)),[]);
  const todayOff=diffD(ganttOrigin,today);

  // Dependency arrow calculations
  const taskPositions=useMemo(()=>{
    const pos={};
    let cumY=0;
    MEMBERS.forEach(m=>{
      cumY+=36; // header
      if(!cLanes[m]){
        (mTasks[m]||[]).forEach((t,i)=>{
          if(t.ganttStart&&t.ganttEnd){
            const s=diffD(ganttOrigin,parse(t.ganttStart));
            const dur=diffD(parse(t.ganttStart),parse(t.ganttEnd));
            pos[t.id]={x:s*DAY_W,xEnd:(s+Math.max(dur,1))*DAY_W,y:cumY+i*ROW_H+ROW_H/2};
          }
        });
        cumY+=Math.max(1,mTasks[m]?.length||0)*ROW_H;
      }
    });
    return pos;
  },[mTasks,cLanes,DAY_W]);

  const depLines=useMemo(()=>{
    const lines=[];
    tasks.filter(t=>t.status==='inprogress'&&(t.dependencies||[]).length>0).forEach(t=>{
      (t.dependencies||[]).forEach(dId=>{
        const from=taskPositions[dId];
        const to=taskPositions[t.id];
        if(from&&to)lines.push({from,to,color:MC[t.assignee]||'#007acc'});
      });
    });
    return lines;
  },[tasks,taskPositions]);

  const handlePD=(e,task,mode)=>{e.stopPropagation();e.preventDefault();setDrag({taskId:task.id,mode,startX:e.clientX,oS:task.ganttStart,oE:task.ganttEnd});};

  useEffect(()=>{
    if(!drag)return;
    const move=e=>{
      const dx=e.clientX-drag.startX;
      const dd=Math.round(dx/DAY_W);
      const oS=parse(drag.oS),oE=parse(drag.oE);
      if(drag.mode==='move'){onUpdate(drag.taskId,{ganttStart:fmt(addD(oS,dd)),ganttEnd:fmt(addD(oE,dd))});}
      else if(drag.mode==='rl'){const ns=addD(oS,dd);if(diffD(ns,oE)>=1)onUpdate(drag.taskId,{ganttStart:fmt(ns)});}
      else if(drag.mode==='rr'){const ne=addD(oE,dd);if(diffD(oS,ne)>=1)onUpdate(drag.taskId,{ganttEnd:fmt(ne)});}
    };
    const up=()=>setDrag(null);
    window.addEventListener('pointermove',move);
    window.addEventListener('pointerup',up);
    return()=>{window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',up);};
  },[drag,onUpdate,DAY_W]);

  const handleCtx=(e,task)=>{
    e.preventDefault();
    setCtxMenu({x:e.clientX,y:e.clientY,task});
  };

  return(
    <div style={{flex:1,display:'flex',flexDirection:'column',minHeight:0}}>
      {/* Header */}
      <div style={{display:'flex',flexShrink:0,borderBottom:'1px solid #2d2d2d'}}>
        <div style={{width:170,flexShrink:0,padding:'0 12px',display:'flex',alignItems:'center',fontSize:10,color:'#888',fontWeight:600,borderRight:'1px solid #2d2d2d',height:44,background:'#1e1e1e',position:'sticky',left:0,zIndex:2}}>MEMBER / TASK</div>
        <div style={{display:'flex',overflow:'hidden',flex:1}}>
          {dates.map((d,i)=>{
            const isT=d.toDateString()===today.toDateString();
            const isW=d.getDay()===0||d.getDay()===6;
            const showLabel=zoom==='week'?d.getDay()===1:true;
            return(
              <div key={i} style={{width:DAY_W,flexShrink:0,textAlign:'center',borderRight:'1px solid #2d2d2d22',height:44,display:'flex',flexDirection:'column',justifyContent:'center',background:isT?'#007acc12':isW?'#ffffff04':'transparent'}}>
                {showLabel&&<Fragment><div style={{fontSize:8,color:'#666',textTransform:'uppercase'}}>{d.toLocaleDateString('en',{weekday:'short'})}</div>
                <div style={{fontSize:zoom==='week'?9:11,color:isT?'#007acc':'#aaa',fontWeight:isT?700:400}}>{d.getDate()}</div></Fragment>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Body */}
      <div style={{flex:1,overflowY:'auto',overflowX:'auto',position:'relative'}} ref={gRef}>
        <div style={{display:'flex',flexDirection:'column',minWidth:170+GANTT_TOTAL_DAYS*DAY_W,position:'relative'}}>
          {/* Dependency arrows SVG overlay */}
          {depLines.length>0&&<svg style={{position:'absolute',top:0,left:170,width:GANTT_TOTAL_DAYS*DAY_W,height:'100%',pointerEvents:'none',zIndex:4}}>
            <defs><marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#888"/></marker></defs>
            {depLines.map((l,i)=>{
              const x1=l.from.xEnd+2,y1=l.from.y;
              const x2=l.to.x-2,y2=l.to.y;
              const mx=(x1+x2)/2;
              return<path key={i} d={`M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`} stroke={l.color+'88'} strokeWidth="1.5" fill="none" markerEnd="url(#arrow)" strokeDasharray={Math.abs(y2-y1)>ROW_H?"4,3":"none"}/>;
            })}
          </svg>}

          {/* Milestone markers */}
          {MILESTONES.map((ms,i)=>{
            const off=diffD(ganttOrigin,parse(ms.date));
            if(off<0||off>=GANTT_TOTAL_DAYS)return null;
            return<div key={i} style={{position:'absolute',left:170+off*DAY_W+DAY_W/2-1,top:0,bottom:0,width:2,background:ms.color+'33',zIndex:3,pointerEvents:'none'}}>
              <div style={{position:'absolute',top:-2,left:-12,display:'flex',flexDirection:'column',alignItems:'center',pointerEvents:'auto'}} title={ms.label}>
                <I.Diamond c={ms.color} s={12}/>
                <span style={{fontSize:8,color:ms.color,fontWeight:600,whiteSpace:'nowrap',marginTop:2}}>{ms.label}</span>
              </div>
            </div>;
          })}

          {MEMBERS.map(member=>{
            const mt=mTasks[member]||[];
            const isC=cLanes[member];
            const laneH=isC?0:Math.max(1,mt.length)*ROW_H;

            return(
              <div key={member} style={{borderBottom:'1px solid #2d2d2d'}}>
                <div style={{display:'flex',height:36,alignItems:'center',background:'#252526',cursor:'pointer',position:'sticky',left:0,zIndex:1}} onClick={()=>setCLanes(p=>({...p,[member]:!p[member]}))}>
                  <div style={{width:170,flexShrink:0,display:'flex',alignItems:'center',gap:6,padding:'0 12px',borderRight:'1px solid #2d2d2d',position:'sticky',left:0,background:'#252526',zIndex:2,height:'100%'}}>
                    <I.Chev open={!isC} s={12}/>
                    <Av name={member} size={18}/>
                    <span style={{fontSize:11,color:'#d4d4d4',fontWeight:500}}>{member}</span>
                    <span style={{fontSize:10,color:'#666',marginLeft:'auto'}}>{mt.length}</span>
                  </div>
                </div>

                <div style={{overflow:'hidden',transition:'max-height .25s ease',maxHeight:isC?0:laneH+10}}>
                  <div style={{display:'flex',position:'relative'}}>
                    <div style={{width:170,flexShrink:0,borderRight:'1px solid #2d2d2d',position:'sticky',left:0,background:'#1e1e1e',zIndex:2}}>
                      {mt.length===0?<div style={{height:ROW_H,display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,color:'#444'}}>—</div>
                      :mt.map(t=>(
                        <div key={t.id} style={{height:ROW_H,display:'flex',alignItems:'center',padding:'0 10px',gap:5,cursor:'pointer'}} onClick={()=>onTaskClick(t)} onContextMenu={e=>handleCtx(e,t)}>
                          <div style={{width:4,height:4,borderRadius:'50%',background:PC[t.priority],flexShrink:0}}/>
                          <span style={{fontSize:10,color:'#aaa',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',flex:1}}>{t.title}</span>
                          {(t.dependencies||[]).length>0&&<span style={{opacity:.4}}><I.Link/></span>}
                        </div>
                      ))}
                    </div>

                    <div style={{flex:1,position:'relative',minHeight:mt.length===0?ROW_H:mt.length*ROW_H}}>
                      {dates.map((d,i)=>{
                        const isW=d.getDay()===0||d.getDay()===6;
                        return<div key={i} style={{position:'absolute',left:i*DAY_W,top:0,bottom:0,width:DAY_W,borderRight:'1px solid #2d2d2d15',background:isW?'#ffffff03':'transparent'}}/>;
                      })}
                      <div style={{position:'absolute',left:todayOff*DAY_W+DAY_W/2,top:0,bottom:0,width:2,background:'#007acc44',zIndex:1}}/>

                      {mt.map((t,idx)=>{
                        if(!t.ganttStart||!t.ganttEnd)return null;
                        const s=diffD(ganttOrigin,parse(t.ganttStart));
                        const dur=diffD(parse(t.ganttStart),parse(t.ganttEnd));
                        const left=s*DAY_W;
                        const width=Math.max(dur*DAY_W,DAY_W);
                        const overdue=t.deadline&&parse(t.deadline)<today;
                        const bc=MC[t.assignee];
                        const prog=t.progress||0;

                        return(
                          <div key={t.id}
                            onContextMenu={e=>handleCtx(e,t)}
                            onMouseEnter={e=>setTip({task:t,x:e.clientX,y:e.clientY})}
                            onMouseMove={e=>{if(tip?.task?.id===t.id)setTip({task:t,x:e.clientX,y:e.clientY});}}
                            onMouseLeave={()=>setTip(null)}
                            style={{position:'absolute',top:idx*ROW_H+5,left,width,height:ROW_H-10,borderRadius:4,background:`${bc}18`,border:`1.5px solid ${bc}66`,cursor:drag?.taskId===t.id?'grabbing':'grab',zIndex:5,transition:drag?.taskId===t.id?'none':'left .15s,width .15s',userSelect:'none',overflow:'hidden'}}>
                            {/* Progress fill */}
                            <div style={{position:'absolute',left:0,top:0,bottom:0,width:`${prog}%`,background:`${bc}25`,borderRadius:'3px 0 0 3px',transition:'width .2s',pointerEvents:'none'}}/>

                            {/* Left resize */}
                            <div onPointerDown={e=>handlePD(e,t,'rl')} style={{position:'absolute',left:-2,top:0,bottom:0,width:8,cursor:'ew-resize',zIndex:6}}>
                              <div style={{position:'absolute',left:2,top:'30%',bottom:'30%',width:2,borderRadius:1,background:bc,opacity:.4}}/>
                            </div>

                            {/* Content */}
                            <div onPointerDown={e=>handlePD(e,t,'move')} onClick={()=>{if(!drag)onTaskClick(t);}} style={{flex:1,display:'flex',alignItems:'center',gap:4,padding:'0 12px',overflow:'hidden',height:'100%',position:'relative',zIndex:1}}>
                              <span style={{fontSize:10,color:'#ddd',fontWeight:500,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{t.title}</span>
                              {overdue&&<span style={{fontSize:8,color:'#f44747',fontWeight:700,flexShrink:0}}>!</span>}
                              <span style={{fontSize:9,color:bc,marginLeft:'auto',fontWeight:600,flexShrink:0}}>{prog}%</span>
                            </div>

                            {/* Right resize */}
                            <div onPointerDown={e=>handlePD(e,t,'rr')} style={{position:'absolute',right:-2,top:0,bottom:0,width:8,cursor:'ew-resize',zIndex:6}}>
                              <div style={{position:'absolute',right:2,top:'30%',bottom:'30%',width:2,borderRadius:1,background:bc,opacity:.4}}/>
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

      {/* Tooltip */}
      {tip&&<GanttTip task={tip.task} x={tip.x} y={tip.y}/>}

      {/* Context menu */}
      {ctxMenu&&<CtxMenu x={ctxMenu.x} y={ctxMenu.y} onClose={()=>setCtxMenu(null)} items={[
        {label:'Open Details',icon:<I.Edit/>,action:()=>onTaskClick(ctxMenu.task)},
        {label:'Move to To Do',action:()=>onUpdate(ctxMenu.task.id,{status:'todo',ganttStart:undefined,ganttEnd:undefined})},
        {label:'Move to Completed',icon:<I.Check/>,action:()=>onUpdate(ctxMenu.task.id,{status:'completed',completedDate:fmt(today),ganttStart:undefined,ganttEnd:undefined,progress:100})},
        {divider:true},
        ...PRIORITIES.map(p=>({label:`Priority: ${p}`,icon:<span style={{color:PC[p]}}>●</span>,action:()=>onUpdate(ctxMenu.task.id,{priority:p})})),
        {divider:true},
        ...MEMBERS.map(m=>({label:`Assign → ${m}`,icon:<Av name={m} size={14}/>,action:()=>onUpdate(ctxMenu.task.id,{assignee:m})})),
      ]}/>}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   CARD COLUMN
   ═══════════════════════════════════════════════════════════════════════════ */
const CardCol = ({title,status,tasks,color,collapsed,onToggle,onTaskClick,onUpdate,searchFilter,memberFilter,tagFilter,priorityFilter,onNewTask,toast:addToast})=>{
  const [ctxMenu,setCtxMenu]=useState(null);

  const fTasks=useMemo(()=>tasks.filter(t=>{
    if(t.status!==status)return false;
    if(searchFilter&&!t.title.toLowerCase().includes(searchFilter.toLowerCase()))return false;
    if(memberFilter&&t.assignee!==memberFilter)return false;
    if(tagFilter&&!(t.tags||[]).includes(tagFilter))return false;
    if(priorityFilter&&t.priority!==priorityFilter)return false;
    return true;
  }).sort((a,b)=>{
    const pi=PRIORITIES.indexOf(a.priority)-PRIORITIES.indexOf(b.priority);
    return pi!==0?pi:(a.deadline||'').localeCompare(b.deadline||'');
  }),[tasks,status,searchFilter,memberFilter,tagFilter,priorityFilter]);

  const handleDrop=e=>{
    e.preventDefault();
    const tid=e.dataTransfer.getData('tid');
    if(!tid)return;
    const u={status};
    if(status==='completed'){u.completedDate=fmt(today);u.ganttStart=undefined;u.ganttEnd=undefined;u.progress=100;}
    if(status==='inprogress'){u.ganttStart=fmt(today);u.ganttEnd=fmt(addD(today,5));}
    if(status==='todo'){u.ganttStart=undefined;u.ganttEnd=undefined;u.completedDate=undefined;}
    onUpdate(tid,u);
    addToast(`Task moved to ${title}`,'#007acc');
  };

  const handleCtx=(e,task)=>{
    e.preventDefault();
    setCtxMenu({x:e.clientX,y:e.clientY,task});
  };

  return(
    <div style={{display:'flex',flexDirection:'column',minWidth:collapsed?44:'auto',width:collapsed?44:290,transition:'width .25s ease',flexShrink:0,borderRight:'1px solid #2d2d2d',background:'#1e1e1e',overflow:'hidden'}}>
      <div style={{display:'flex',alignItems:'center',gap:8,padding:collapsed?'12px 8px':'12px 14px',borderBottom:'1px solid #2d2d2d',cursor:'pointer',background:'#252526',flexShrink:0,height:48,boxSizing:'border-box'}} onClick={onToggle}>
        {collapsed?<div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:6,width:'100%'}}>
          <I.Chev open={false} s={12}/>
          <div style={{writingMode:'vertical-rl',textOrientation:'mixed',fontSize:11,fontWeight:600,color,letterSpacing:'.03em'}}>{title}</div>
          <div style={{background:color+'22',color,fontSize:10,fontWeight:700,padding:'2px 6px',borderRadius:8}}>{fTasks.length}</div>
        </div>:<Fragment>
          <I.Chev open={true} s={12}/>
          <div style={{width:8,height:8,borderRadius:'50%',background:color}}/>
          <span style={{fontSize:12,fontWeight:600,color:'#d4d4d4',flex:1}}>{title}</span>
          <span style={{fontSize:11,color:'#888',background:'#2d2d2d',padding:'1px 8px',borderRadius:8,fontWeight:600}}>{fTasks.length}</span>
          <button onClick={e=>{e.stopPropagation();onNewTask(status);}} style={{background:'none',border:'none',color:'#888',cursor:'pointer',padding:2}}><I.Plus/></button>
        </Fragment>}
      </div>

      {!collapsed&&<div style={{flex:1,overflowY:'auto',padding:8,display:'flex',flexDirection:'column',gap:5}} onDragOver={e=>e.preventDefault()} onDrop={handleDrop}>
        {fTasks.map(task=>(
          <div key={task.id} draggable onDragStart={e=>e.dataTransfer.setData('tid',task.id)} onClick={()=>onTaskClick(task)} onContextMenu={e=>handleCtx(e,task)}
            style={{background:'#252526',borderRadius:6,padding:'10px 12px',cursor:'pointer',border:'1px solid #2d2d2d',transition:'border-color .15s,transform .15s'}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor='#007acc44';e.currentTarget.style.transform='translateY(-1px)';}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor='#2d2d2d';e.currentTarget.style.transform='none';}}>
            {(task.tags||[]).length>0&&<div style={{display:'flex',gap:3,marginBottom:6,flexWrap:'wrap'}}>
              {task.tags.map(t=><span key={t} style={{background:TC[t]||'#333',color:'#bbb',fontSize:9,padding:'1px 6px',borderRadius:3,fontWeight:500}}>{t}</span>)}
            </div>}
            <div style={{color:'#d4d4d4',fontSize:12,fontWeight:500,lineHeight:1.4,marginBottom:4}}>{task.title}</div>
            {/* Subtask progress */}
            {task.subtasks?.length>0&&<div style={{display:'flex',alignItems:'center',gap:6,marginBottom:6}}>
              <div style={{flex:1,height:3,borderRadius:2,background:'#333'}}>
                <div style={{width:`${task.progress||0}%`,height:'100%',borderRadius:2,background:MC[task.assignee]}}/>
              </div>
              <span style={{fontSize:9,color:'#888'}}>{task.subtasks.filter(s=>s.done).length}/{task.subtasks.length}</span>
            </div>}
            <div style={{display:'flex',alignItems:'center',gap:6,flexWrap:'wrap'}}>
              <span style={{fontSize:9,fontWeight:700,color:PC[task.priority],textTransform:'uppercase',letterSpacing:'.05em'}}>{task.priority}</span>
              {task.estHours&&<span style={{display:'flex',alignItems:'center',gap:2,fontSize:10,color:'#666'}}><I.Clock/>{task.estHours}h</span>}
              {task.deadline&&<span style={{display:'flex',alignItems:'center',gap:2,fontSize:10,color:task.status!=='completed'&&parse(task.deadline)<today?'#f44747':'#666'}}><I.Cal/>{task.deadline.slice(5)}</span>}
              {task.comments?.length>0&&<span style={{display:'flex',alignItems:'center',gap:2,fontSize:10,color:'#666'}}><I.Chat/>{task.comments.length}</span>}
              {(task.dependencies||[]).length>0&&<span style={{display:'flex',alignItems:'center',gap:2,fontSize:10,color:'#c586c0'}}><I.Link/>{task.dependencies.length}</span>}
              <div style={{marginLeft:'auto'}}><Av name={task.assignee} size={22}/></div>
            </div>
          </div>
        ))}
      </div>}

      {ctxMenu&&<CtxMenu x={ctxMenu.x} y={ctxMenu.y} onClose={()=>setCtxMenu(null)} items={[
        {label:'Open Details',icon:<I.Edit/>,action:()=>onTaskClick(ctxMenu.task)},
        {label:'Move to To Do',action:()=>{onUpdate(ctxMenu.task.id,{status:'todo',ganttStart:undefined,ganttEnd:undefined,completedDate:undefined});addToast('Moved to To Do');}},
        {label:'Move to In Progress',action:()=>{onUpdate(ctxMenu.task.id,{status:'inprogress',ganttStart:fmt(today),ganttEnd:fmt(addD(today,5)),completedDate:undefined});addToast('Moved to In Progress');}},
        {label:'Move to Completed',icon:<I.Check/>,action:()=>{onUpdate(ctxMenu.task.id,{status:'completed',completedDate:fmt(today),progress:100});addToast('Completed!','#4ec9b0');}},
        {divider:true},
        ...PRIORITIES.map(p=>({label:`Priority: ${p}`,icon:<span style={{color:PC[p]}}>●</span>,action:()=>onUpdate(ctxMenu.task.id,{priority:p})})),
        {divider:true},
        {label:'Delete Task',icon:<I.Trash/>,danger:true,action:()=>{/* handled by parent */}},
      ]}/>}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   EXPORT
   ═══════════════════════════════════════════════════════════════════════════ */
const exportCSV=(tasks)=>{
  const h=['Title','Assignee','Priority','Status','Est Hours','Deadline','Tags','Progress','Subtasks Done','Subtasks Total','Created','Completed'];
  const rows=tasks.map(t=>[t.title,t.assignee,t.priority,t.status,t.estHours||0,t.deadline||'',(t.tags||[]).join(';'),t.progress||0,(t.subtasks||[]).filter(s=>s.done).length,(t.subtasks||[]).length,t.created||'',t.completedDate||'']);
  const csv=[h,...rows].map(r=>r.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob=new Blob([csv],{type:'text/csv'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');a.href=url;a.download=`kanban-export-${fmt(today)}.csv`;a.click();
  URL.revokeObjectURL(url);
};

const exportPDF=(tasks)=>{
  const w=window.open('','_blank');
  if(!w)return;
  const byStatus=(s)=>tasks.filter(t=>t.status===s);
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
    <h1>Project Board — Sprint 12</h1>
    <p>Exported: ${today.toLocaleDateString()}</p>
    ${['todo','inprogress','completed'].map(s=>{
      const st=byStatus(s);
      return`<h2>${s==='todo'?'To Do':s==='inprogress'?'In Progress':'Completed'} (${st.length})</h2>
      <table><tr><th>Title</th><th>Assignee</th><th>Priority</th><th>Est.H</th><th>Deadline</th><th>Progress</th><th>Tags</th></tr>
      ${st.map(t=>`<tr><td>${t.title}</td><td>${t.assignee}</td><td class="${t.priority.toLowerCase()}">${t.priority}</td><td>${t.estHours||0}</td><td>${t.deadline||'—'}</td><td>${t.progress||0}%</td><td>${(t.tags||[]).join(', ')}</td></tr>`).join('')}</table>`;
    }).join('')}
  </body></html>`);
  w.document.close();
  setTimeout(()=>w.print(),300);
};

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN APP
   ═══════════════════════════════════════════════════════════════════════════ */
export default function App(){
  const [tasks,setTasks]=useState(initTasks);
  const [sel,setSel]=useState(null);
  const [newTask,setNewTask]=useState(null);
  const [showStats,setShowStats]=useState(false);
  const [colC,setColC]=useState({todo:false,completed:false,ip:false});
  const [search,setSearch]=useState('');
  const [memberF,setMemberF]=useState('');
  const [tagF,setTagF]=useState('');
  const [prioF,setPrioF]=useState('');
  const [zoom,setZoom]=useState('day');
  const [toasts,setToasts]=useState([]);
  const [history,setHistory]=useState([]);
  const [future,setFuture]=useState([]);
  const [showFilters,setShowFilters]=useState(false);
  const searchRef=useRef();

  const addToast=useCallback((msg,color='#007acc')=>{
    const id=Date.now();
    setToasts(p=>[...p,{id,msg,color}]);
    setTimeout(()=>setToasts(p=>p.filter(t=>t.id!==id)),3000);
  },[]);

  const removeToast=useCallback((id)=>setToasts(p=>p.filter(t=>t.id!==id)),[]);

  const pushHistory=useCallback(()=>{
    setHistory(p=>[...p.slice(-30),JSON.parse(JSON.stringify(tasks))]);
    setFuture([]);
  },[tasks]);

  const undo=useCallback(()=>{
    if(history.length===0)return;
    setFuture(p=>[...p,JSON.parse(JSON.stringify(tasks))]);
    const prev=history[history.length-1];
    setHistory(p=>p.slice(0,-1));
    setTasks(prev);
    addToast('Undone','#dcdcaa');
  },[history,tasks,addToast]);

  const redo=useCallback(()=>{
    if(future.length===0)return;
    setHistory(p=>[...p,JSON.parse(JSON.stringify(tasks))]);
    const next=future[future.length-1];
    setFuture(p=>p.slice(0,-1));
    setTasks(next);
    addToast('Redone','#dcdcaa');
  },[future,tasks,addToast]);

  const updateTask=useCallback((id,u)=>{
    pushHistory();
    setTasks(p=>p.map(t=>t.id===id?{...t,...u}:t));
    setSel(p=>p&&p.id===id?{...p,...u}:p);
  },[pushHistory]);

  const deleteTask=useCallback((id)=>{
    pushHistory();
    setTasks(p=>p.filter(t=>t.id!==id));
    addToast('Task deleted','#f44747');
  },[pushHistory,addToast]);

  const addTask=useCallback((task)=>{
    pushHistory();
    setTasks(p=>[...p,task]);
  },[pushHistory]);

  // Keyboard shortcuts
  useEffect(()=>{
    const handler=(e)=>{
      if(e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA'||e.target.tagName==='SELECT')return;
      if(e.key==='n'||e.key==='N'){e.preventDefault();setNewTask('todo');}
      if(e.key==='/'){e.preventDefault();searchRef.current?.focus();}
      if(e.key==='Escape'){setSel(null);setShowStats(false);setNewTask(null);}
      if((e.ctrlKey||e.metaKey)&&e.key==='z'&&!e.shiftKey){e.preventDefault();undo();}
      if((e.ctrlKey||e.metaKey)&&e.key==='z'&&e.shiftKey){e.preventDefault();redo();}
      if((e.ctrlKey||e.metaKey)&&e.key==='y'){e.preventDefault();redo();}
    };
    window.addEventListener('keydown',handler);
    return()=>window.removeEventListener('keydown',handler);
  },[undo,redo]);

  const hasFilters=!!(memberF||tagF||prioF||search);

  return(
    <div style={{fontFamily:"'Cascadia Code','Fira Code','Segoe UI',monospace",background:'#1e1e1e',color:'#d4d4d4',height:'100vh',display:'flex',flexDirection:'column',overflow:'hidden',userSelect:'none'}}>
      {/* Animations */}
      <style>{`
        @keyframes slideIn{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}
        ::-webkit-scrollbar{width:8px;height:8px}
        ::-webkit-scrollbar-track{background:#1e1e1e}
        ::-webkit-scrollbar-thumb{background:#3c3c3c;border-radius:4px}
        ::-webkit-scrollbar-thumb:hover{background:#555}
        ::selection{background:#007acc44}
      `}</style>

      {/* ─── TOP BAR ─── */}
      <div style={{display:'flex',alignItems:'center',gap:8,padding:'0 14px',height:42,background:'#252526',borderBottom:'1px solid #3c3c3c',flexShrink:0}}>
        <div style={{display:'flex',alignItems:'center',gap:6}}>
          <div style={{width:16,height:16,borderRadius:3,background:'linear-gradient(135deg,#007acc,#0098ff)',display:'flex',alignItems:'center',justifyContent:'center'}}>
            <span style={{fontSize:9,fontWeight:900,color:'#fff'}}>K</span>
          </div>
          <span style={{fontSize:13,fontWeight:600,color:'#d4d4d4',letterSpacing:'-.01em'}}>Project Board</span>
          <span style={{fontSize:10,color:'#666',marginLeft:2}}>Sprint 12</span>
        </div>

        <div style={{width:1,height:20,background:'#3c3c3c',margin:'0 4px'}}/>

        {/* Search */}
        <div style={{display:'flex',alignItems:'center',gap:5,background:'#1e1e1e',borderRadius:4,padding:'4px 10px',border:'1px solid #3c3c3c',width:180}}>
          <I.Search/>
          <input ref={searchRef} value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search... ( / )" style={{background:'transparent',border:'none',outline:'none',color:'#ccc',fontSize:11,fontFamily:'inherit',width:'100%'}}/>
          {search&&<button onClick={()=>setSearch('')} style={{background:'none',border:'none',color:'#666',cursor:'pointer',padding:0}}><I.X/></button>}
        </div>

        {/* Filter toggle */}
        <button onClick={()=>setShowFilters(!showFilters)} style={{display:'flex',alignItems:'center',gap:4,background:hasFilters?'#007acc22':'#2d2d2d',border:`1px solid ${hasFilters?'#007acc':'#3c3c3c'}`,borderRadius:4,padding:'4px 10px',color:hasFilters?'#007acc':'#999',fontSize:11,cursor:'pointer',fontFamily:'inherit'}}>
          <I.Filter/> Filters {hasFilters&&<span style={{background:'#007acc',color:'#fff',fontSize:9,padding:'0 5px',borderRadius:6,fontWeight:700}}>{[memberF,tagF,prioF].filter(Boolean).length}</span>}
        </button>

        {/* Zoom */}
        <div style={{display:'flex',gap:2,alignItems:'center'}}>
          <button onClick={()=>setZoom('day')} style={{background:zoom==='day'?'#007acc':'#2d2d2d',border:'none',borderRadius:'3px 0 0 3px',padding:'4px 8px',color:zoom==='day'?'#fff':'#888',fontSize:10,cursor:'pointer',fontFamily:'inherit'}}>Day</button>
          <button onClick={()=>setZoom('week')} style={{background:zoom==='week'?'#007acc':'#2d2d2d',border:'none',borderRadius:'0 3px 3px 0',padding:'4px 8px',color:zoom==='week'?'#fff':'#888',fontSize:10,cursor:'pointer',fontFamily:'inherit'}}>Week</button>
        </div>

        {/* Undo/Redo */}
        <div style={{display:'flex',gap:2}}>
          <button onClick={undo} disabled={history.length===0} style={{background:'#2d2d2d',border:'none',borderRadius:3,padding:'4px 6px',color:history.length>0?'#ccc':'#555',cursor:history.length>0?'pointer':'default',opacity:history.length>0?1:.4}} title="Undo (Ctrl+Z)"><I.Undo/></button>
          <button onClick={redo} disabled={future.length===0} style={{background:'#2d2d2d',border:'none',borderRadius:3,padding:'4px 6px',color:future.length>0?'#ccc':'#555',cursor:future.length>0?'pointer':'default',opacity:future.length>0?1:.4}} title="Redo (Ctrl+Shift+Z)"><I.Redo/></button>
        </div>

        <div style={{flex:1}}/>

        {/* Avatars */}
        <div style={{display:'flex',alignItems:'center'}}>
          {MEMBERS.map((m,i)=>(
            <div key={m} style={{marginLeft:i>0?-5:0,zIndex:MEMBERS.length-i,cursor:'pointer',transition:'transform .15s',border:memberF===m?'2px solid #007acc':'2px solid transparent',borderRadius:'50%'}}
              onClick={()=>setMemberF(p=>p===m?'':m)}
              onMouseEnter={e=>e.currentTarget.style.transform='translateY(-2px)'}
              onMouseLeave={e=>e.currentTarget.style.transform=''} title={m}>
              <Av name={m} size={24}/>
            </div>
          ))}
        </div>

        <div style={{width:1,height:20,background:'#3c3c3c',margin:'0 2px'}}/>

        {/* Export */}
        <button onClick={()=>exportCSV(tasks)} style={{display:'flex',alignItems:'center',gap:4,background:'#2d2d2d',border:'1px solid #3c3c3c',borderRadius:4,padding:'4px 8px',color:'#ccc',fontSize:10,cursor:'pointer',fontFamily:'inherit'}} title="Export CSV"><I.DL/>CSV</button>
        <button onClick={()=>exportPDF(tasks)} style={{display:'flex',alignItems:'center',gap:4,background:'#2d2d2d',border:'1px solid #3c3c3c',borderRadius:4,padding:'4px 8px',color:'#ccc',fontSize:10,cursor:'pointer',fontFamily:'inherit'}} title="Export PDF"><I.DL/>PDF</button>

        <button onClick={()=>setShowStats(true)} style={{display:'flex',alignItems:'center',gap:5,background:'#2d2d2d',border:'1px solid #3c3c3c',borderRadius:4,padding:'4px 10px',color:'#ccc',fontSize:11,cursor:'pointer',fontFamily:'inherit',fontWeight:500}}><I.Chart/>Stats</button>
        <button onClick={()=>setNewTask('todo')} style={{display:'flex',alignItems:'center',gap:5,background:'#007acc',border:'none',borderRadius:4,padding:'4px 12px',color:'#fff',fontSize:11,cursor:'pointer',fontFamily:'inherit',fontWeight:500}}><I.Plus/>New <I.Kbd>N</I.Kbd></button>
      </div>

      {/* ─── FILTER BAR ─── */}
      {showFilters&&<div style={{display:'flex',alignItems:'center',gap:10,padding:'6px 14px',background:'#1e1e1e',borderBottom:'1px solid #2d2d2d',flexShrink:0,animation:'slideIn .15s ease'}}>
        <span style={{fontSize:10,color:'#888'}}>Filter by:</span>
        <select value={memberF} onChange={e=>setMemberF(e.target.value)} style={{background:'#2d2d2d',color:'#ccc',border:'1px solid #3c3c3c',borderRadius:3,padding:'3px 6px',fontSize:11,outline:'none',fontFamily:'inherit'}}>
          <option value="">All Members</option>{MEMBERS.map(m=><option key={m}>{m}</option>)}
        </select>
        <select value={tagF} onChange={e=>setTagF(e.target.value)} style={{background:'#2d2d2d',color:'#ccc',border:'1px solid #3c3c3c',borderRadius:3,padding:'3px 6px',fontSize:11,outline:'none',fontFamily:'inherit'}}>
          <option value="">All Tags</option>{TAGS.map(t=><option key={t}>{t}</option>)}
        </select>
        <select value={prioF} onChange={e=>setPrioF(e.target.value)} style={{background:'#2d2d2d',color:'#ccc',border:'1px solid #3c3c3c',borderRadius:3,padding:'3px 6px',fontSize:11,outline:'none',fontFamily:'inherit'}}>
          <option value="">All Priorities</option>{PRIORITIES.map(p=><option key={p}>{p}</option>)}
        </select>
        {hasFilters&&<button onClick={()=>{setMemberF('');setTagF('');setPrioF('');setSearch('');}} style={{background:'#f4474722',color:'#f44747',border:'none',borderRadius:3,padding:'3px 10px',fontSize:10,cursor:'pointer'}}>Clear All</button>}
      </div>}

      {/* ─── BOARD ─── */}
      <div style={{flex:1,display:'flex',overflow:'hidden'}}>
        <CardCol title="TO DO" status="todo" tasks={tasks} color="#dcdcaa" collapsed={colC.todo} onToggle={()=>setColC(p=>({...p,todo:!p.todo}))} onTaskClick={setSel} onUpdate={updateTask} searchFilter={search} memberFilter={memberF} tagFilter={tagF} priorityFilter={prioF} onNewTask={setNewTask} toast={addToast}/>

        <div style={{flex:1,display:'flex',flexDirection:'column',borderRight:'1px solid #2d2d2d',overflow:'hidden'}}
          onDragOver={e=>e.preventDefault()}
          onDrop={e=>{e.preventDefault();const tid=e.dataTransfer.getData('tid');if(!tid)return;updateTask(tid,{status:'inprogress',ganttStart:fmt(today),ganttEnd:fmt(addD(today,5)),completedDate:undefined});addToast('Moved to In Progress','#007acc');}}>
          <div style={{display:'flex',alignItems:'center',gap:8,padding:'0 14px',height:48,background:'#252526',borderBottom:'1px solid #2d2d2d',flexShrink:0,boxSizing:'border-box',cursor:'pointer'}} onClick={()=>setColC(p=>({...p,ip:!p.ip}))}>
            <I.Chev open={!colC.ip} s={12}/>
            <div style={{width:8,height:8,borderRadius:'50%',background:'#007acc'}}/>
            <span style={{fontSize:12,fontWeight:600,color:'#d4d4d4'}}>IN PROGRESS</span>
            <span style={{fontSize:10,color:'#666'}}>— Gantt View</span>
            <div style={{display:'flex',gap:4,marginLeft:8}}>
              {MILESTONES.map((ms,i)=><span key={i} style={{display:'flex',alignItems:'center',gap:3,fontSize:9,color:ms.color}}><I.Diamond c={ms.color} s={8}/>{ms.label}</span>)}
            </div>
            <span style={{fontSize:11,color:'#888',background:'#2d2d2d',padding:'1px 8px',borderRadius:8,fontWeight:600,marginLeft:'auto'}}>{tasks.filter(t=>t.status==='inprogress').length}</span>
            <button onClick={e=>{e.stopPropagation();setNewTask('inprogress');}} style={{background:'none',border:'none',color:'#888',cursor:'pointer',padding:2}}><I.Plus/></button>
          </div>
          {!colC.ip?<Gantt tasks={tasks} onTaskClick={setSel} onUpdate={updateTask} searchFilter={search} memberFilter={memberF} tagFilter={tagF} priorityFilter={prioF} zoom={zoom}/>
          :<div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',color:'#444',fontSize:12}}>Gantt collapsed — click header to expand</div>}
        </div>

        <CardCol title="COMPLETED" status="completed" tasks={tasks} color="#4ec9b0" collapsed={colC.completed} onToggle={()=>setColC(p=>({...p,completed:!p.completed}))} onTaskClick={setSel} onUpdate={updateTask} searchFilter={search} memberFilter={memberF} tagFilter={tagF} priorityFilter={prioF} onNewTask={setNewTask} toast={addToast}/>
      </div>

      {/* ─── STATUS BAR ─── */}
      <div style={{display:'flex',alignItems:'center',gap:12,padding:'0 12px',height:22,background:'#007acc',flexShrink:0,fontSize:10,color:'#fff'}}>
        <span style={{fontWeight:600}}>Sprint 12</span>
        <span>Tasks: {tasks.length}</span>
        <span>Todo: {tasks.filter(t=>t.status==='todo').length}</span>
        <span>Active: {tasks.filter(t=>t.status==='inprogress').length}</span>
        <span>Done: {tasks.filter(t=>t.status==='completed').length}</span>
        <span style={{color:'#fff8',fontSize:9}}>N: new · /: search · Ctrl+Z/Y: undo/redo · Esc: close</span>
        <span style={{marginLeft:'auto'}}>{tasks.filter(t=>t.status!=='completed'&&t.deadline&&parse(t.deadline)<today).length} overdue</span>
        <span>{fmt(today)}</span>
      </div>

      {/* ─── MODALS ─── */}
      {sel&&<TaskModal task={sel} onClose={()=>setSel(null)} onUpdate={updateTask} onDelete={deleteTask} allTasks={tasks} toast={addToast}/>}
      {newTask&&<NewTaskModal defaultStatus={newTask} onClose={()=>setNewTask(null)} onAdd={addTask} toast={addToast}/>}
      {showStats&&<StatsPanel tasks={tasks} onClose={()=>setShowStats(false)}/>}

      {/* ─── TOASTS ─── */}
      <ToastContainer toasts={toasts} remove={removeToast}/>
    </div>
  );
}
