/**
 * Governance API Service
 *
 * 直接 HTTP 调用治理模块 API 端点。
 * 基于 fetch API，返回类型化响应。
 */

import type {
  RuleClientDTO,
  RuleRevisionClientDTO,
  CreateRuleReq,
  UpdateRuleReq,
  ListRulesQuery,
  ListRulesRes,
  SearchRulesQuery,
  SearchRulesRes,
} from '../types';

const BASE_URL = '/api/v1/governance/rules';

/**
 * 处理 API 响应，统一错误处理
 */
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const message = body?.error?.message || body?.message || response.statusText;
    throw new GovernanceApiError(message, response.status, body);
  }

  const json = await response.json();
  // API uses HttpResponse<T> envelope: { ok, data, error }
  return json.data ?? json;
}

/**
 * 构建查询参数字符串
 */
function buildQuery(params?: Record<string, unknown>): string {
  if (!params) return '';
  const entries = Object.entries(params).filter(([, v]) => v != null);
  if (entries.length === 0) return '';
  const searchParams = new URLSearchParams();
  for (const [key, value] of entries) {
    if (Array.isArray(value)) {
      value.forEach((v) => searchParams.append(key, String(v)));
    } else {
      searchParams.set(key, String(value));
    }
  }
  return `?${searchParams.toString()}`;
}

/**
 * Governance API Error
 */
export class GovernanceApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body?: unknown,
  ) {
    super(message);
    this.name = 'GovernanceApiError';
  }
}

/**
 * Governance API Service
 */
export const governanceApi = {
  /**
   * 创建规则
   */
  async createRule(req: CreateRuleReq): Promise<RuleClientDTO> {
    const response = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    });
    return handleResponse<RuleClientDTO>(response);
  },

  /**
   * 获取规则列表
   */
  async listRules(query?: ListRulesQuery): Promise<ListRulesRes> {
    const qs = buildQuery(query as Record<string, unknown>);
    const response = await fetch(`${BASE_URL}${qs}`);
    return handleResponse<ListRulesRes>(response);
  },

  /**
   * 获取单个规则
   */
  async getRule(id: string): Promise<RuleClientDTO> {
    const response = await fetch(`${BASE_URL}/${id}`);
    return handleResponse<RuleClientDTO>(response);
  },

  /**
   * 更新规则
   */
  async updateRule(id: string, req: UpdateRuleReq): Promise<RuleClientDTO> {
    const response = await fetch(`${BASE_URL}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    });
    return handleResponse<RuleClientDTO>(response);
  },

  /**
   * 删除规则
   */
  async deleteRule(id: string): Promise<{ success: boolean }> {
    const response = await fetch(`${BASE_URL}/${id}`, {
      method: 'DELETE',
    });
    return handleResponse<{ success: boolean }>(response);
  },

  /**
   * 搜索规则
   */
  async searchRules(query: SearchRulesQuery): Promise<SearchRulesRes> {
    const qs = buildQuery(query as Record<string, unknown>);
    const response = await fetch(`${BASE_URL}/search${qs}`);
    return handleResponse<SearchRulesRes>(response);
  },

  /**
   * 获取修订历史
   */
  async getRevisions(ruleId: string): Promise<RuleRevisionClientDTO[]> {
    const response = await fetch(`${BASE_URL}/${ruleId}/revisions`);
    return handleResponse<RuleRevisionClientDTO[]>(response);
  },
};
