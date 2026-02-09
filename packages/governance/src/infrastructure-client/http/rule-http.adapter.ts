/**
 * Rule HTTP Adapter
 * 
 * HTTP implementation of IRuleApiClient.
 * Implements rule API operations using HTTP REST calls.
 */

import type { IRuleApiClient } from '@/contracts/api/rule-api-client.port';
import type {
  CreateRuleReq,
  CreateRuleRes,
  GetRuleReq,
  GetRuleRes,
  UpdateRuleReq,
  UpdateRuleRes,
  DeleteRuleReq,
  DeleteRuleRes,
  ListRulesQuery,
  ListRulesRes,
  SearchRulesQuery,
  SearchRulesRes,
} from '@/contracts/api';

/**
 * HTTP Client Interface
 * 最小化 HTTP 客户端接口定义
 */
export interface HttpClient {
  get<T = any>(url: string, config?: { params?: any }): Promise<T>;
  post<T = any>(url: string, data?: any): Promise<T>;
  patch<T = any>(url: string, data?: any): Promise<T>;
  delete<T = any>(url: string): Promise<T>;
}

/**
 * Rule HTTP Adapter
 * 
 * Implements IRuleApiClient using HTTP REST API calls.
 */
export class RuleHttpAdapter implements IRuleApiClient {
  private readonly baseUrl = '/api/governance/rules';

  constructor(private readonly httpClient: HttpClient) {}

  // ===== Rule CRUD =====

  /**
   * 创建规则
   */
  async createRule(req: CreateRuleReq): Promise<CreateRuleRes> {
    return this.httpClient.post(this.baseUrl, req);
  }

  /**
   * 获取单个规则（通过 ID 或 code）
   */
  async getRule(req: GetRuleReq): Promise<GetRuleRes> {
    if (req.id) {
      return this.httpClient.get(`${this.baseUrl}/${req.id}`);
    } else if (req.code) {
      return this.httpClient.get(`${this.baseUrl}/by-code/${req.code}`);
    }
    throw new Error('Must provide either id or code');
  }

  /**
   * 更新规则
   */
  async updateRule(ruleId: string, req: UpdateRuleReq): Promise<UpdateRuleRes> {
    return this.httpClient.patch(`${this.baseUrl}/${ruleId}`, req);
  }

  /**
   * 删除规则
   */
  async deleteRule(req: DeleteRuleReq): Promise<DeleteRuleRes> {
    return this.httpClient.delete(`${this.baseUrl}/${req.id}`);
  }

  /**
   * 列出规则（带过滤和分页）
   */
  async listRules(query?: ListRulesQuery): Promise<ListRulesRes> {
    return this.httpClient.get(this.baseUrl, { params: query });
  }

  /**
   * 搜索规则（关键词搜索）
   */
  async searchRules(query: SearchRulesQuery): Promise<SearchRulesRes> {
    return this.httpClient.get(`${this.baseUrl}/search`, { params: query });
  }
}

/**
 * Factory function to create Rule HTTP Adapter
 */
export function createRuleHttpAdapter(httpClient: HttpClient): IRuleApiClient {
  return new RuleHttpAdapter(httpClient);
}
