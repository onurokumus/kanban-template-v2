import type { Task } from "./types.ts";

export const MEMBERS = ["Unassigned", "Murat", "Onur", "Mustafa", "Enes", "Berk", "İnan", "Fatih", "Muratcan"] as const;
export const MC: Record<string, string> = { 
  Murat: "var(--member-murat)", 
  Onur: "var(--member-onur)", 
  Mustafa: "var(--member-mustafa)", 
  Enes: "var(--member-enes)", 
  Berk: "var(--member-berk)", 
  "İnan": "var(--member-inan)", 
  Fatih: "var(--member-fatih)", 
  Muratcan: "var(--member-muratcan)",
  Unassigned: "var(--member-unassigned)"
};
export const PRIORITIES = ["Critical", "High", "Medium", "Low"] as const;
export const PC: Record<string, string> = { 
  Critical: "var(--prio-critical)", 
  High: "var(--prio-high)", 
  Medium: "var(--prio-medium)", 
  Low: "var(--prio-low)" 
};
export const TAGS = ["ATAK", "GOKBEY", "ONTON", "KIHA", "EVTOL", "UCTON", "INFRA"] as const;
export const TC: Record<string, string> = { 
  ATAK: "var(--tag-atak-bg)", 
  GOKBEY: "var(--tag-gokbey-bg)", 
  ONTON: "var(--tag-onton-bg)", 
  KIHA: "var(--tag-kiha-bg)", 
  EVTOL: "var(--tag-evtol-bg)", 
  UCTON: "var(--tag-ucton-bg)", 
  INFRA: "var(--tag-infra-bg)" 
};
export const TCT: Record<string, string> = { 
  ATAK: "var(--tag-atak-text)", 
  GOKBEY: "var(--tag-gokbey-text)", 
  ONTON: "var(--tag-onton-text)", 
  KIHA: "var(--tag-kiha-text)", 
  EVTOL: "var(--tag-evtol-text)", 
  UCTON: "var(--tag-ucton-text)", 
  INFRA: "var(--tag-infra-text)" 
};

export const ROW_H = 48;
export const today = new Date();
export const addD = (d: Date, n: number): Date => new Date(d.getTime() + n * 864e5);
export const ganttOrigin = addD(today, -7);

export const fmt = (d: Date | null): string => d ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` : '';
export const parse = (s: string | undefined | null): Date | null => { if (!s) return null; const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
export const diffD = (a: Date | string, b: Date | string): number => {
  const da = typeof a === 'string' ? parse(a) : a;
  const db = typeof b === 'string' ? parse(b) : b;
  if (!da || !db) return 0;
  return Math.round((db.getTime() - da.getTime()) / 864e5);
};

export const isTaskBlocked = (task: Task, allTasks: Task[]): boolean =>
  (task.dependencies || []).some(depId => {
    const dep = allTasks.find(x => x.id === depId);
    return dep && dep.status !== 'completed';
  });

export const uid = (): string => crypto.randomUUID();
export const sid = (): string => crypto.randomUUID();
export const coid = (): string => crypto.randomUUID();


export const initTasks = (): Task[] => [
  // --- IN PROGRESS ---
  { 
    id: uid(), title: "Rotor Blade Airloads Analysis", desc: "Evaluate pressure distribution across main rotor blades during high-speed hover.", 
    assignee: "Murat", priority: "High", tags: ["ATAK", "UCTON"], status: "inprogress", estHours: 16, deadline: "2026-03-22", ganttStart: "2026-03-14", ganttEnd: "2026-03-22", 
    comments: [{ id: coid(), author: "Onur", text: "Are we using CFD or simplified BEMT?", ts: "2026-03-14T09:00" }], 
    created: "2026-03-10", 
    subtasks: [
      { id: sid(), title: "Mesh generation", done: true, ganttStart: "2026-03-14", deadline: "2026-03-16" }, 
      { id: sid(), title: "Solver setup", done: false, ganttStart: "2026-03-17", deadline: "2026-03-19" }, 
      { id: sid(), title: "Data extraction", done: false, ganttStart: "2026-03-20", deadline: "2026-03-22" }
    ], 
    dependencies: [], progress: 33 
  },
  { 
    id: "epic-vib-sup", title: "Vibration Suppression System", desc: "Optimize active vibration control parameters for GOKBEY airframe.", 
    assignee: "Onur", priority: "Medium", tags: ["GOKBEY"], status: "inprogress", estHours: 8, deadline: "2026-03-20", ganttStart: "2026-03-12", ganttEnd: "2026-03-20", 
    comments: [], created: "2026-03-11", 
    isEpic: true,
    subtasks: [], 
    dependencies: [], progress: 66 
  },
  {
    id: uid(), epicId: "epic-vib-sup", title: "Sensor placement", desc: "Determine optimal sensor layout.", 
    assignee: "Onur", priority: "Medium", tags: ["GOKBEY"], status: "completed", estHours: 2, deadline: "2026-03-14", ganttStart: "2026-03-12", ganttEnd: "2026-03-14", 
    comments: [], created: "2026-03-11", completedDate: "2026-03-14", subtasks: [], dependencies: [], progress: 100
  },
  {
    id: uid(), epicId: "epic-vib-sup", title: "Actuator tuning", desc: "Tune the actuators for maximum efficiency.", 
    assignee: "Onur", priority: "Medium", tags: ["GOKBEY"], status: "completed", estHours: 3, deadline: "2026-03-17", ganttStart: "2026-03-15", ganttEnd: "2026-03-17", 
    comments: [], created: "2026-03-11", completedDate: "2026-03-17", subtasks: [], dependencies: [], progress: 100
  },
  {
    id: uid(), epicId: "epic-vib-sup", title: "Software validation", desc: "Validate control software outputs.", 
    assignee: "Onur", priority: "Medium", tags: ["GOKBEY"], status: "inprogress", estHours: 3, deadline: "2026-03-20", ganttStart: "2026-03-18", ganttEnd: "2026-03-20", 
    comments: [], created: "2026-03-11", subtasks: [], dependencies: [], progress: 20
  },
  {
    id: uid(), epicId: "epic-vib-sup", title: "Data Analysis", desc: "Analyze the output telemetry data.", 
    assignee: "Onur", priority: "High", tags: ["GOKBEY"], status: "inprogress", estHours: 5, deadline: "2026-03-22", ganttStart: "2026-03-19", ganttEnd: "2026-03-22", 
    comments: [], created: "2026-03-11", subtasks: [], dependencies: [], progress: 10
  },
  { id: uid(), title: "Flight Control Law Update", desc: "Implement new control laws for transition flight in EVTOL prototype.", assignee: "Mustafa", priority: "Critical", tags: ["EVTOL"], status: "inprogress", estHours: 6, deadline: "2026-03-20", ganttStart: "2026-03-14", ganttEnd: "2026-03-20", comments: [], created: "2026-03-13", subtasks: [], dependencies: [], progress: 20 },
  { id: uid(), title: "Stability Derivative Extraction", desc: "Extract lateral stability derivatives from wind tunnel data.", assignee: "Enes", priority: "Medium", tags: ["KIHA"], status: "inprogress", estHours: 12, deadline: "2026-03-25", ganttStart: "2026-03-15", ganttEnd: "2026-03-25", comments: [], created: "2026-03-12", subtasks: [], dependencies: [], progress: 30 },
  { id: uid(), title: "Structural Load Testing", desc: "Conduct static load tests on ONTON landing gear assembly.", assignee: "Berk", priority: "High", tags: ["ONTON"], status: "inprogress", estHours: 10, deadline: "2026-03-20", ganttStart: "2026-03-10", ganttEnd: "2026-03-20", comments: [], created: "2026-03-09", subtasks: [], dependencies: [], progress: 50 },
  { id: uid(), title: "Aeroacoustic Noise Mapping", desc: "Map acoustic signature of rotor hub during hover maneuvers.", assignee: "İnan", priority: "High", tags: ["INFRA", "UCTON"], status: "inprogress", estHours: 20, deadline: "2026-03-26", ganttStart: "2026-03-12", ganttEnd: "2026-03-26", comments: [], created: "2026-03-08", subtasks: [], dependencies: [], progress: 40 },
  { id: uid(), title: "Tail Rotor Fatigue Suite", desc: "Bench testing tail rotor assembly for long-term fatigue lifecycle.", assignee: "Fatih", priority: "Medium", tags: ["GOKBEY"], status: "inprogress", estHours: 40, deadline: "2026-04-05", ganttStart: "2026-03-14", ganttEnd: "2026-04-05", comments: [], created: "2026-03-12", subtasks: [], dependencies: [], progress: 15 },
  { id: uid(), title: "BMS Thermals Check", desc: "Monitor battery management system thermal behavior in EVTOL high-load cycles.", assignee: "Muratcan", priority: "High", tags: ["EVTOL"], status: "inprogress", estHours: 24, deadline: "2026-03-28", ganttStart: "2026-03-15", ganttEnd: "2026-03-28", comments: [], created: "2026-03-15", subtasks: [], dependencies: [], progress: 10 },
  { id: uid(), title: "Landing Gear Shock Absorption", desc: "Testing shock absorber performance for KIHA emergency landings.", assignee: "Enes", priority: "Low", tags: ["KIHA", "INFRA"], status: "inprogress", estHours: 14, deadline: "2026-03-24", ganttStart: "2026-03-16", ganttEnd: "2026-03-24", comments: [], created: "2026-03-14", subtasks: [], dependencies: [], progress: 5 },
  { id: uid(), title: "Ground Resonance Analysis", desc: "Stability check for ground resonance under various lead-lag damper states.", assignee: "Murat", priority: "Critical", tags: ["GOKBEY", "UCTON"], status: "inprogress", estHours: 18, deadline: "2026-03-21", ganttStart: "2026-03-15", ganttEnd: "2026-03-21", comments: [], created: "2026-03-14", subtasks: [], dependencies: [], progress: 25 },
  { id: uid(), title: "Flight Test Instrumentation Setup", desc: "Calibrating strain gauges and thermocouples for upcoming flight test campaign.", assignee: "Mustafa", priority: "High", tags: ["ATAK", "ONTON"], status: "inprogress", estHours: 12, deadline: "2026-03-20", ganttStart: "2026-03-16", ganttEnd: "2026-03-20", comments: [], created: "2026-03-15", subtasks: [], dependencies: [], progress: 5 },
  { id: uid(), title: "Propulsion Torque Validation", desc: "Verifying e-motor torque limits against structural margins in hover.", assignee: "Berk", priority: "Medium", tags: ["EVTOL"], status: "inprogress", estHours: 14, deadline: "2026-03-26", ganttStart: "2026-03-16", ganttEnd: "2026-03-26", comments: [], created: "2026-03-15", subtasks: [], dependencies: [], progress: 10 },
  { id: uid(), title: "Hub Drag Breakdown", desc: "Component-level drag analysis for the main rotor hub assembly.", assignee: "İnan", priority: "Medium", tags: ["UCTON", "GOKBEY"], status: "inprogress", estHours: 20, deadline: "2026-03-29", ganttStart: "2026-03-16", ganttEnd: "2026-03-29", comments: [], created: "2026-03-14", subtasks: [], dependencies: [], progress: 5 },
  { id: uid(), title: "Blade Tip Vortex Interaction", desc: "High-fidelity simulation of BVI noise during descent profiles.", assignee: "Muratcan", priority: "Medium", tags: ["INFRA"], status: "inprogress", estHours: 24, deadline: "2026-03-25", ganttStart: "2026-03-16", ganttEnd: "2026-03-25", comments: [], created: "2026-03-15", subtasks: [], dependencies: [], progress: 10 },

  // --- COMPLETED ---
  { 
    id: uid(), title: "Fuselage Drag Reduction", desc: "Optimizing the rear fuselage fairing for ATAK to reduce interference drag.", 
    assignee: "Onur", priority: "Medium", tags: ["ATAK"], status: "completed", estHours: 35, deadline: "2026-03-15", completedDate: "2026-03-14", 
    comments: [], created: "2026-03-01", 
    subtasks: [
      { id: sid(), title: "Baseline CFD", done: true }, 
      { id: sid(), title: "Fairing geometry tweak", done: true }, 
      { id: sid(), title: "Final report", done: true }
    ], 
    dependencies: [], progress: 100 
  },
  { id: uid(), title: "Main Hub Casting Inspection", desc: "Non-destructive testing and X-ray inspection of the primary rotor hub casting.", assignee: "Berk", priority: "Critical", tags: ["GOKBEY", "INFRA"], status: "completed", estHours: 20, deadline: "2026-03-10", completedDate: "2026-03-08", comments: [], created: "2026-02-25", subtasks: [], dependencies: [], progress: 100 },
  { id: uid(), title: "Avionics Thermal Analysis", desc: "Thermal simulation of the cockpit avionics rack under extreme ambient conditions.", assignee: "İnan", priority: "Medium", tags: ["ONTON"], status: "completed", estHours: 15, deadline: "2026-03-12", completedDate: "2026-03-11", comments: [], created: "2026-03-01", subtasks: [], dependencies: [], progress: 100 },
  { id: uid(), title: "KIHA Rotor Head Assembly", desc: "Final assembly and torque check of the KIHA unmanned rotor system.", assignee: "Enes", priority: "High", tags: ["KIHA"], status: "completed", estHours: 18, deadline: "2026-03-14", completedDate: "2026-03-13", comments: [], created: "2026-03-05", subtasks: [], dependencies: [], progress: 100 },
  { id: uid(), title: "Pilot Seat Crashworthiness", desc: "Dynamic impact simulation for the new pilot seat design.", assignee: "Fatih", priority: "Critical", tags: ["ATAK"], status: "completed", estHours: 25, deadline: "2026-03-05", completedDate: "2026-03-04", comments: [], created: "2026-02-20", subtasks: [], dependencies: [], progress: 100 },
  { id: uid(), title: "EVTOL Battery Drop Test", desc: "Safety validation for the battery module under high-G impact conditions.", assignee: "Muratcan", priority: "Critical", tags: ["EVTOL"], status: "completed", estHours: 12, deadline: "2026-03-01", completedDate: "2026-02-28", comments: [], created: "2026-02-15", subtasks: [], dependencies: [], progress: 100 },

  // --- TO DO ---
  { 
    id: uid(), title: "Pitch Link Clearance Check", desc: "Verifying bearing clearances in the main rotor pitch control links.", 
    assignee: "Mustafa", priority: "Medium", tags: ["GOKBEY"], status: "todo", estHours: 8, deadline: "2026-03-28", 
    comments: [], created: "2026-03-14", 
    subtasks: [
      { id: sid(), title: "Disassemble linkage", done: false }, 
      { id: sid(), title: "Measure tolerances", done: false }
    ], 
    dependencies: [], progress: 0 
  },
  { id: uid(), title: "ATAK Pylon Aero Fairing", desc: "Design review of the aerodynamic fairing for the wing-mounted weapon pylons.", assignee: "Onur", priority: "Low", tags: ["ATAK"], status: "todo", estHours: 12, deadline: "2026-04-05", comments: [], created: "2026-03-15", subtasks: [], dependencies: [], progress: 0 },
  { id: uid(), title: "Transmission Oil Cooling", desc: "Efficiency test for the main gearbox oil cooling system in hot-day scenarios.", assignee: "Unassigned", priority: "High", tags: ["ONTON"], status: "todo", estHours: 20, deadline: "2026-04-10", comments: [], created: "2026-03-15", subtasks: [], dependencies: [], progress: 0 },
  { id: uid(), title: "EM Radiated Emissions", desc: "Spectrum analysis for electromagnetically radiating components in the fuselage.", assignee: "Unassigned", priority: "Medium", tags: ["INFRA"], status: "todo", estHours: 16, deadline: "2026-04-12", comments: [], created: "2026-03-16", subtasks: [], dependencies: [], progress: 0 },
  { id: uid(), title: "Pilot Flight Manual Update", desc: "Updating the handling qualities section of the preliminary flight manual.", assignee: "Fatih", priority: "Low", tags: ["ATAK", "GOKBEY"], status: "todo", estHours: 10, deadline: "2026-04-15", comments: [], created: "2026-03-16", subtasks: [], dependencies: [], progress: 0 },
  { id: uid(), title: "Swashplate Load Survey", desc: "Measuring control rod loads during lateral cyclic maneuvers.", assignee: "Unassigned", priority: "Low", tags: ["KIHA"], status: "todo", estHours: 12, deadline: "2026-04-02", comments: [], created: "2026-03-16", subtasks: [], dependencies: [], progress: 0 },
];
