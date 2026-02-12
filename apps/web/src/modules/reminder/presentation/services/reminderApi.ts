/**
 * Reminder API Service
 * Fetch-based API for reminder templates and groups.
 */

const TEMPLATES_BASE = '/api/v1/reminder-templates';
const GROUPS_BASE = '/api/v1/reminder-groups';

export class ReminderApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message); this.name = 'ReminderApiError';
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new ReminderApiError(body || `HTTP ${res.status}`, res.status);
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

export const reminderApi = {
  // ── Templates ──
  async listTemplates(params?: Record<string, unknown>) {
    const res = await fetch(`${TEMPLATES_BASE}${buildQuery(params)}`);
    return handleResponse<{ data: unknown[]; total: number }>(res);
  },

  async getTemplate(id: string) {
    const res = await fetch(`${TEMPLATES_BASE}/${id}`);
    return handleResponse<unknown>(res);
  },

  async createTemplate(data: Record<string, unknown>) {
    const res = await fetch(TEMPLATES_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<unknown>(res);
  },

  async updateTemplate(id: string, data: Record<string, unknown>) {
    const res = await fetch(`${TEMPLATES_BASE}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<unknown>(res);
  },

  async deleteTemplate(id: string) {
    const res = await fetch(`${TEMPLATES_BASE}/${id}`, { method: 'DELETE' });
    return handleResponse<void>(res);
  },

  async getUpcomingReminders(params?: Record<string, unknown>) {
    const res = await fetch(`${TEMPLATES_BASE}/upcoming${buildQuery(params)}`);
    return handleResponse<{ data: unknown[] }>(res);
  },

  // ── Groups ──
  async listGroups(params?: Record<string, unknown>) {
    const res = await fetch(`${GROUPS_BASE}${buildQuery(params)}`);
    return handleResponse<{ data: unknown[]; total: number }>(res);
  },

  async getGroup(id: string) {
    const res = await fetch(`${GROUPS_BASE}/${id}`);
    return handleResponse<unknown>(res);
  },

  async createGroup(data: Record<string, unknown>) {
    const res = await fetch(GROUPS_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<unknown>(res);
  },

  async updateGroup(id: string, data: Record<string, unknown>) {
    const res = await fetch(`${GROUPS_BASE}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<unknown>(res);
  },

  async deleteGroup(id: string) {
    const res = await fetch(`${GROUPS_BASE}/${id}`, { method: 'DELETE' });
    return handleResponse<void>(res);
  },

  async switchGroupControlMode(id: string, data: Record<string, unknown>) {
    const res = await fetch(`${GROUPS_BASE}/${id}/control-mode`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<unknown>(res);
  },
};
