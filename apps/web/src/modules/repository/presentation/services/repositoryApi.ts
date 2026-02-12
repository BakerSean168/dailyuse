/**
 * Repository API Service
 * Fetch-based API for repository and resource operations.
 */

const BASE = '/api/v1/repositories';

export class RepositoryApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message); this.name = 'RepositoryApiError';
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new RepositoryApiError(body || `HTTP ${res.status}`, res.status);
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

export const repositoryApi = {
  // ── Repositories ──
  async listRepositories(params?: Record<string, unknown>) {
    const res = await fetch(`${BASE}${buildQuery(params)}`);
    return handleResponse<{ data: unknown[]; total: number }>(res);
  },

  async getRepository(id: string) {
    const res = await fetch(`${BASE}/${id}`);
    return handleResponse<unknown>(res);
  },

  async createRepository(data: Record<string, unknown>) {
    const res = await fetch(BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<unknown>(res);
  },

  async updateRepository(id: string, data: Record<string, unknown>) {
    const res = await fetch(`${BASE}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<unknown>(res);
  },

  async deleteRepository(id: string) {
    const res = await fetch(`${BASE}/${id}`, { method: 'DELETE' });
    return handleResponse<void>(res);
  },

  // ── Resources ──
  async listResources(repoId: string, params?: Record<string, unknown>) {
    const res = await fetch(`${BASE}/${repoId}/resources${buildQuery(params)}`);
    return handleResponse<{ data: unknown[]; total: number }>(res);
  },

  async getResource(repoId: string, resourceId: string) {
    const res = await fetch(`${BASE}/${repoId}/resources/${resourceId}`);
    return handleResponse<unknown>(res);
  },

  async createResource(repoId: string, data: Record<string, unknown>) {
    const res = await fetch(`${BASE}/${repoId}/resources`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<unknown>(res);
  },

  async updateResource(repoId: string, resourceId: string, data: Record<string, unknown>) {
    const res = await fetch(`${BASE}/${repoId}/resources/${resourceId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<unknown>(res);
  },

  async deleteResource(repoId: string, resourceId: string) {
    const res = await fetch(`${BASE}/${repoId}/resources/${resourceId}`, { method: 'DELETE' });
    return handleResponse<void>(res);
  },
};
