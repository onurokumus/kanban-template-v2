const BASE = `http://${window.location.hostname}:5000/api`;

async function req(path: string, opts: RequestInit = {}) {
  const res = await fetch(`${BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(opts.headers as Record<string, string> || {}) },
    ...opts,
  });
  if (res.status === 401) {
    // Trigger re-auth
    window.dispatchEvent(new CustomEvent('auth:unauthorized'));
    throw new Error('Unauthorized');
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || res.statusText);
  }
  return res.json();
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export const authAPI = {
  me: () => req('/auth/me'),
  login: (username: string, password: string) =>
    req('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
  register: (username: string, password: string, displayName: string) =>
    req('/auth/register', { method: 'POST', body: JSON.stringify({ username, password, displayName }) }),
  logout: () => req('/auth/logout', { method: 'POST' }),
};

// ─── Tasks ───────────────────────────────────────────────────────────────────

import type { Task } from './types';

export const taskAPI = {
  getAll: (): Promise<Task[]> => req('/tasks'),
  create: (task: Partial<Task>) => req('/tasks', { method: 'POST', body: JSON.stringify(task) }),
  update: (id: string, data: Partial<Task>) => req(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => req(`/tasks/${id}`, { method: 'DELETE' }),

  // Subtasks
  addSubtask: (taskId: string, sub: any) =>
    req(`/tasks/${taskId}/subtasks`, { method: 'POST', body: JSON.stringify(sub) }),
  updateSubtask: (taskId: string, subId: string, data: any) =>
    req(`/tasks/${taskId}/subtasks/${subId}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteSubtask: (taskId: string, subId: string) =>
    req(`/tasks/${taskId}/subtasks/${subId}`, { method: 'DELETE' }),
  reorderSubtasks: (taskId: string, order: string[]) =>
    req(`/tasks/${taskId}/reorder-subtasks`, { method: 'PUT', body: JSON.stringify({ order }) }),

  // Comments
  addComment: (taskId: string, comment: any) =>
    req(`/tasks/${taskId}/comments`, { method: 'POST', body: JSON.stringify(comment) }),
  updateComment: (taskId: string, commentId: string, data: any) =>
    req(`/tasks/${taskId}/comments/${commentId}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteComment: (taskId: string, commentId: string) =>
    req(`/tasks/${taskId}/comments/${commentId}`, { method: 'DELETE' }),
};
