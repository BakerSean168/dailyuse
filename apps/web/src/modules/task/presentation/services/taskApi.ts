/**
 * Task API Service
 * @module task/presentation/services
 */

import type {
  TaskTemplateClientDTO,
  TaskInstanceClientDTO,
  TaskFolderClientDTO,
  CreateTaskReq,
  UpdateTaskReq,
  GetInstancesByRangeReq,
  GetInstancesByRangeRes,
} from '@dailyuse/contracts/task';

const TEMPLATE_URL = '/api/v1/task-templates';
const INSTANCE_URL = '/api/v1/task-instances';

export class TaskApiError extends Error {
  constructor(message: string, public readonly status: number, public readonly body?: unknown) {
    super(message);
    this.name = 'TaskApiError';
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const message = body?.error?.message || body?.message || response.statusText;
    throw new TaskApiError(message, response.status, body);
  }
  const json = await response.json();
  return json.data ?? json;
}

function buildQuery(params?: Record<string, unknown>): string {
  if (!params) return '';
  const entries = Object.entries(params).filter(([, v]) => v != null);
  if (entries.length === 0) return '';
  const sp = new URLSearchParams();
  for (const [k, v] of entries) {
    if (Array.isArray(v)) v.forEach((x) => sp.append(k, String(x)));
    else sp.set(k, String(v));
  }
  return `?${sp.toString()}`;
}

function jsonHeaders(): HeadersInit {
  return { 'Content-Type': 'application/json' };
}

export const taskApi = {
  // ========== Templates ==========
  async listTemplates(query?: Record<string, unknown>): Promise<{ data: TaskTemplateClientDTO[]; total: number }> {
    const res = await fetch(`${TEMPLATE_URL}${buildQuery(query)}`);
    return handleResponse(res);
  },

  async getTemplate(id: string): Promise<TaskTemplateClientDTO> {
    const res = await fetch(`${TEMPLATE_URL}/${id}`);
    return handleResponse<TaskTemplateClientDTO>(res);
  },

  async createTemplate(req: CreateTaskReq): Promise<TaskTemplateClientDTO> {
    const res = await fetch(TEMPLATE_URL, { method: 'POST', headers: jsonHeaders(), body: JSON.stringify(req) });
    return handleResponse<TaskTemplateClientDTO>(res);
  },

  async updateTemplate(id: string, req: UpdateTaskReq): Promise<TaskTemplateClientDTO> {
    const res = await fetch(`${TEMPLATE_URL}/${id}`, { method: 'PUT', headers: jsonHeaders(), body: JSON.stringify(req) });
    return handleResponse<TaskTemplateClientDTO>(res);
  },

  async deleteTemplate(id: string): Promise<void> {
    const res = await fetch(`${TEMPLATE_URL}/${id}`, { method: 'DELETE' });
    await handleResponse<void>(res);
  },

  async activateTemplate(id: string): Promise<TaskTemplateClientDTO> {
    const res = await fetch(`${TEMPLATE_URL}/${id}/activate`, { method: 'POST' });
    return handleResponse<TaskTemplateClientDTO>(res);
  },

  async pauseTemplate(id: string): Promise<TaskTemplateClientDTO> {
    const res = await fetch(`${TEMPLATE_URL}/${id}/pause`, { method: 'POST' });
    return handleResponse<TaskTemplateClientDTO>(res);
  },

  async archiveTemplate(id: string): Promise<TaskTemplateClientDTO> {
    const res = await fetch(`${TEMPLATE_URL}/${id}/archive`, { method: 'POST' });
    return handleResponse<TaskTemplateClientDTO>(res);
  },

  // ========== Instances ==========
  async listInstances(query?: Record<string, unknown>): Promise<GetInstancesByRangeRes> {
    const res = await fetch(`${INSTANCE_URL}${buildQuery(query)}`);
    return handleResponse<GetInstancesByRangeRes>(res);
  },

  async getInstance(id: string): Promise<TaskInstanceClientDTO> {
    const res = await fetch(`${INSTANCE_URL}/${id}`);
    return handleResponse<TaskInstanceClientDTO>(res);
  },

  async startInstance(id: string): Promise<TaskInstanceClientDTO> {
    const res = await fetch(`${INSTANCE_URL}/${id}/start`, { method: 'POST' });
    return handleResponse<TaskInstanceClientDTO>(res);
  },

  async completeInstance(id: string): Promise<TaskInstanceClientDTO> {
    const res = await fetch(`${INSTANCE_URL}/${id}/complete`, { method: 'POST' });
    return handleResponse<TaskInstanceClientDTO>(res);
  },

  async skipInstance(id: string): Promise<TaskInstanceClientDTO> {
    const res = await fetch(`${INSTANCE_URL}/${id}/skip`, { method: 'POST' });
    return handleResponse<TaskInstanceClientDTO>(res);
  },

  async deleteInstance(id: string): Promise<void> {
    const res = await fetch(`${INSTANCE_URL}/${id}`, { method: 'DELETE' });
    await handleResponse<void>(res);
  },

  // ========== Folders ==========
  async listFolders(): Promise<{ data: TaskFolderClientDTO[]; total: number }> {
    const res = await fetch(`${TEMPLATE_URL}/folders`);
    return handleResponse(res);
  },
};
