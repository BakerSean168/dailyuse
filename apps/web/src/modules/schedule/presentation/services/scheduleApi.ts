/**
 * Schedule API Service
 * Fetch-based API for schedule task and job operations.
 */

const BASE = '/api/v1/schedule-tasks';

export class ScheduleApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message); this.name = 'ScheduleApiError';
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new ScheduleApiError(body || `HTTP ${res.status}`, res.status);
  }
  return res.json() as Promise<T>;
}

function buildQuery(params?: Record<string, unknown>): string {
  if (!params) return '';
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') sp.append(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : '';
}

export const scheduleApi = {
  // ── Schedule Tasks ──
  async listTasks(params?: Record<string, unknown>) {
    const res = await fetch(`${BASE}${buildQuery(params)}`);
    return handleResponse<{ data: unknown[]; total: number }>(res);
  },

  async getTask(id: string) {
    const res = await fetch(`${BASE}/${id}`);
    return handleResponse<unknown>(res);
  },

  async createTask(data: Record<string, unknown>) {
    const res = await fetch(BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<unknown>(res);
  },

  async updateTask(id: string, data: Record<string, unknown>) {
    const res = await fetch(`${BASE}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<unknown>(res);
  },

  async deleteTask(id: string) {
    const res = await fetch(`${BASE}/${id}`, { method: 'DELETE' });
    return handleResponse<void>(res);
  },

  async pauseTask(id: string) {
    const res = await fetch(`${BASE}/${id}/pause`, { method: 'PATCH' });
    return handleResponse<unknown>(res);
  },

  async resumeTask(id: string) {
    const res = await fetch(`${BASE}/${id}/resume`, { method: 'PATCH' });
    return handleResponse<unknown>(res);
  },

  // ── Executions ──
  async listExecutions(taskId: string, params?: Record<string, unknown>) {
    const res = await fetch(`${BASE}/${taskId}/executions${buildQuery(params)}`);
    return handleResponse<{ data: unknown[]; total: number }>(res);
  },

  // ── Batch ──
  async batchOperation(data: Record<string, unknown>) {
    const res = await fetch(`${BASE}/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<unknown>(res);
  },
};
