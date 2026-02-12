/**
 * Notification API Service
 * Fetch-based API for notification operations.
 */

const BASE = '/api/v1/notifications';

export class NotificationApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message); this.name = 'NotificationApiError';
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new NotificationApiError(body || `HTTP ${res.status}`, res.status);
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

export const notificationApi = {
  // ── Query ──
  async query(params?: Record<string, unknown>) {
    const res = await fetch(`${BASE}${buildQuery(params)}`);
    return handleResponse<{ data: unknown[]; total: number }>(res);
  },

  async getById(id: string) {
    const res = await fetch(`${BASE}/${id}`);
    return handleResponse<unknown>(res);
  },

  // ── Mutations ──
  async markAsRead(id: string) {
    const res = await fetch(`${BASE}/${id}/read`, { method: 'PATCH' });
    return handleResponse<unknown>(res);
  },

  async markAllAsRead() {
    const res = await fetch(`${BASE}/read-all`, { method: 'PATCH' });
    return handleResponse<void>(res);
  },

  async dismiss(id: string) {
    const res = await fetch(`${BASE}/${id}`, { method: 'DELETE' });
    return handleResponse<void>(res);
  },

  async dismissAll() {
    const res = await fetch(`${BASE}/dismiss-all`, { method: 'DELETE' });
    return handleResponse<void>(res);
  },

  async executeAction(id: string, actionId: string) {
    const res = await fetch(`${BASE}/${id}/actions/${actionId}`, { method: 'POST' });
    return handleResponse<unknown>(res);
  },

  // ── Stats ──
  async getStats() {
    const res = await fetch(`${BASE}/stats`);
    return handleResponse<{ unreadCount: number; total: number }>(res);
  },

  // ── Preferences ──
  async getPreference() {
    const res = await fetch(`${BASE}/preferences`);
    return handleResponse<unknown>(res);
  },

  async updatePreference(data: Record<string, unknown>) {
    const res = await fetch(`${BASE}/preferences`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<unknown>(res);
  },
};
