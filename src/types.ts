export interface Subtask {
  id: string;
  title: string;
  done: boolean;
}

export interface Comment {
  id: string;
  author: string;
  text: string;
  ts: string;
}

export interface Task {
  id: string;
  title: string;
  desc: string;
  assignee: string;
  priority: string;
  tags: string[];
  status: "todo" | "inprogress" | "completed";
  estHours: number;
  deadline: string;
  comments: Comment[];
  created: string;
  subtasks: Subtask[];
  dependencies: string[];
  progress: number;
  ganttStart?: string;
  ganttEnd?: string;
  completedDate?: string;
}

export interface Toast {
  id: number;
  msg: string;
  color: string;
}

export interface Milestone {
  date: string;
  label: string;
  color: string;
}

export interface CtxMenuItem {
  label?: string;
  icon?: React.ReactNode;
  action?: () => void;
  shortcut?: string;
  danger?: boolean;
  divider?: boolean;
}

export interface MemberStat {
  name: string;
  total: number;
  todo: number;
  ip: number;
  done: number;
  totalH: number;
  doneH: number;
  overdue: number;
  vel: number;
  color: string;
}
