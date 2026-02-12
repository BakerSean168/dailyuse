/**
 * Setting API Service
 * Fetch-based API for user setting operations.
 */

const BASE = '/api/v1/settings';

export class SettingApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message); this.name = 'SettingApiError';
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new SettingApiError(body || `HTTP ${res.status}`, res.status);
  }
  return res.json() as Promise<T>;
}

export const settingApi = {
  async getSettings() {
    const res = await fetch(BASE);
    return handleResponse<unknown>(res);
  },

  async getDefaults() {
    const res = await fetch(`${BASE}/defaults`);
    return handleResponse<unknown>(res);
  },

  async updateEntry(key: string, value: unknown) {
    const res = await fetch(`${BASE}/entries/${key}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value }),
    });
    return handleResponse<unknown>(res);
  },

  async batchUpdate(entries: Array<{ key: string; value: unknown }>) {
    const res = await fetch(`${BASE}/entries/batch`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entries }),
    });
    return handleResponse<unknown>(res);
  },

  async resetToDefaults() {
    const res = await fetch(`${BASE}/reset`, { method: 'POST' });
    return handleResponse<unknown>(res);
  },

  async exportSettings() {
    const res = await fetch(`${BASE}/export`);
    return handleResponse<unknown>(res);
  },

  async importSettings(data: unknown) {
    const res = await fetch(`${BASE}/import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<unknown>(res);
  },
};
