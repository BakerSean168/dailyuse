/**
 * Goal API Service
 *
 * 直接 HTTP 调用 Goal 模块 API 端点。
 * 基于 fetch API，返回类型化响应。
 *
 * @module goal/presentation/services
 */

import type {
  GoalClientDTO,
  GoalFolderClientDTO,
  GoalRecordClientDTO,
  KeyResultClientDTO,
  GoalReviewClientDTO,
  CreateGoalReq,
  UpdateGoalReq,
  QueryGoalsReq,
  QueryGoalsRes,
  CreateGoalFolderReq,
  UpdateGoalFolderReq,
  AddKeyResultReq,
  UpdateKeyResultReq,
  CreateGoalRecordReq,
  CreateGoalReviewReq,
  UpdateGoalReviewReq,
} from '@dailyuse/contracts/goal';

const BASE_URL = '/api/v1/goals';

// ============ Error ============

export class GoalApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body?: unknown,
  ) {
    super(message);
    this.name = 'GoalApiError';
  }
}

// ============ Helpers ============

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const message = body?.error?.message || body?.message || response.statusText;
    throw new GoalApiError(message, response.status, body);
  }
  const json = await response.json();
  return json.data ?? json;
}

function buildQuery(params?: Record<string, unknown>): string {
  if (!params) return '';
  const entries = Object.entries(params).filter(([, v]) => v != null);
  if (entries.length === 0) return '';
  const sp = new URLSearchParams();
  for (const [key, value] of entries) {
    if (Array.isArray(value)) {
      value.forEach((v) => sp.append(key, String(v)));
    } else {
      sp.set(key, String(value));
    }
  }
  return `?${sp.toString()}`;
}

function jsonHeaders(): HeadersInit {
  return { 'Content-Type': 'application/json' };
}

// ============ API ============

export const goalApi = {
  // ========== Goals ==========

  async queryGoals(query?: Partial<QueryGoalsReq>): Promise<QueryGoalsRes> {
    const qs = buildQuery(query as Record<string, unknown>);
    const res = await fetch(`${BASE_URL}${qs}`);
    return handleResponse<QueryGoalsRes>(res);
  },

  async getGoal(id: string): Promise<GoalClientDTO> {
    const res = await fetch(`${BASE_URL}/${id}`);
    return handleResponse<GoalClientDTO>(res);
  },

  async createGoal(req: CreateGoalReq): Promise<GoalClientDTO> {
    const res = await fetch(BASE_URL, {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify(req),
    });
    return handleResponse<GoalClientDTO>(res);
  },

  async updateGoal(id: string, req: UpdateGoalReq): Promise<GoalClientDTO> {
    const res = await fetch(`${BASE_URL}/${id}`, {
      method: 'PUT',
      headers: jsonHeaders(),
      body: JSON.stringify(req),
    });
    return handleResponse<GoalClientDTO>(res);
  },

  async deleteGoal(id: string): Promise<void> {
    const res = await fetch(`${BASE_URL}/${id}`, { method: 'DELETE' });
    await handleResponse<void>(res);
  },

  // ========== Folders ==========

  async listFolders(query?: Record<string, unknown>): Promise<{ data: GoalFolderClientDTO[]; total: number }> {
    const qs = buildQuery(query);
    const res = await fetch(`${BASE_URL}/folders${qs}`);
    return handleResponse(res);
  },

  async createFolder(req: CreateGoalFolderReq): Promise<GoalFolderClientDTO> {
    const res = await fetch(`${BASE_URL}/folders`, {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify(req),
    });
    return handleResponse<GoalFolderClientDTO>(res);
  },

  async updateFolder(id: string, req: UpdateGoalFolderReq): Promise<GoalFolderClientDTO> {
    const res = await fetch(`${BASE_URL}/folders/${id}`, {
      method: 'PUT',
      headers: jsonHeaders(),
      body: JSON.stringify(req),
    });
    return handleResponse<GoalFolderClientDTO>(res);
  },

  async deleteFolder(id: string): Promise<void> {
    const res = await fetch(`${BASE_URL}/folders/${id}`, { method: 'DELETE' });
    await handleResponse<void>(res);
  },

  // ========== Key Results ==========

  async getKeyResults(goalId: string): Promise<{ data: KeyResultClientDTO[]; total: number }> {
    const res = await fetch(`${BASE_URL}/${goalId}/key-results`);
    return handleResponse(res);
  },

  async addKeyResult(goalId: string, req: AddKeyResultReq): Promise<KeyResultClientDTO> {
    const res = await fetch(`${BASE_URL}/${goalId}/key-results`, {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify(req),
    });
    return handleResponse<KeyResultClientDTO>(res);
  },

  async updateKeyResult(goalId: string, krId: string, req: UpdateKeyResultReq): Promise<KeyResultClientDTO> {
    const res = await fetch(`${BASE_URL}/${goalId}/key-results/${krId}`, {
      method: 'PUT',
      headers: jsonHeaders(),
      body: JSON.stringify(req),
    });
    return handleResponse<KeyResultClientDTO>(res);
  },

  async deleteKeyResult(goalId: string, krId: string): Promise<void> {
    const res = await fetch(`${BASE_URL}/${goalId}/key-results/${krId}`, { method: 'DELETE' });
    await handleResponse<void>(res);
  },

  // ========== Records ==========

  async getRecords(goalId: string): Promise<{ data: GoalRecordClientDTO[]; total: number }> {
    const res = await fetch(`${BASE_URL}/${goalId}/records`);
    return handleResponse(res);
  },

  async createRecord(goalId: string, req: CreateGoalRecordReq): Promise<GoalRecordClientDTO> {
    const res = await fetch(`${BASE_URL}/${goalId}/records`, {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify(req),
    });
    return handleResponse<GoalRecordClientDTO>(res);
  },

  async deleteRecord(goalId: string, recordId: string): Promise<void> {
    const res = await fetch(`${BASE_URL}/${goalId}/records/${recordId}`, { method: 'DELETE' });
    await handleResponse<void>(res);
  },

  // ========== Reviews ==========

  async getReviews(goalId: string): Promise<{ data: GoalReviewClientDTO[]; total: number }> {
    const res = await fetch(`${BASE_URL}/${goalId}/reviews`);
    return handleResponse(res);
  },

  async createReview(goalId: string, req: CreateGoalReviewReq): Promise<GoalReviewClientDTO> {
    const res = await fetch(`${BASE_URL}/${goalId}/reviews`, {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify(req),
    });
    return handleResponse<GoalReviewClientDTO>(res);
  },

  async updateReview(goalId: string, reviewId: string, req: UpdateGoalReviewReq): Promise<GoalReviewClientDTO> {
    const res = await fetch(`${BASE_URL}/${goalId}/reviews/${reviewId}`, {
      method: 'PUT',
      headers: jsonHeaders(),
      body: JSON.stringify(req),
    });
    return handleResponse<GoalReviewClientDTO>(res);
  },

  async deleteReview(goalId: string, reviewId: string): Promise<void> {
    const res = await fetch(`${BASE_URL}/${goalId}/reviews/${reviewId}`, { method: 'DELETE' });
    await handleResponse<void>(res);
  },
};
