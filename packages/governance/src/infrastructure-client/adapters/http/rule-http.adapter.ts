/**
 * Rule HTTP Adapter.
 * 规则 HTTP 适配器。
 *
 * HTTP REST implementation of IRuleApiClient.
 * IRuleApiClient 的 HTTP REST 实现。
 *
 * Delegates all HTTP communication to IResultHttpClient, which handles
 * serialization, error mapping, and transport concerns.
 * 将所有 HTTP 通信委托给 IResultHttpClient，由其处理序列化、错误映射和传输细节。
 *
 * URL construction pattern:
 * URL 构造模式：
 * - Base: /governance/rules
 * - Get by ID: /governance/rules/:id
 * - Get by code: /governance/rules/by-code/:code
 * - Revisions: /governance/rules/:ruleId/revisions
 * - Search: /governance/rules/search
 */

import type { Result } from '@dailyuse/contracts/result';
import { error } from '@dailyuse/contracts/result';
import type {
  IRuleApiClient,
  IResultHttpClient,
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
  GetRuleRevisionsQuery,
  GetRuleRevisionsRes,
} from '../types';

/**
 * Rule HTTP Adapter.
 * 规则 HTTP 适配器。
 *
 * Implements IRuleApiClient using HTTP REST API calls.
 * 使用 HTTP REST API 调用实现 IRuleApiClient。
 */
export class RuleHttpAdapter implements IRuleApiClient {
  private readonly baseUrl = '/governance/rules';

  constructor(private readonly httpClient: IResultHttpClient) {}

  // ===== Rule CRUD =====

  /** @see IRuleApiClient.createRule */
  async createRule(req: CreateRuleReq): Promise<Result<CreateRuleRes>> {
    return this.httpClient.post(this.baseUrl, req);
  }

  /** @see IRuleApiClient.getRule — supports lookup by id or code */
  async getRule(req: GetRuleReq): Promise<Result<GetRuleRes>> {
    if (req.id) {
      return this.httpClient.get(`${this.baseUrl}/${req.id}`);
    } else if (req.code) {
      return this.httpClient.get(`${this.baseUrl}/by-code/${req.code}`);
    }
    return error('VALIDATION_ERROR', 'Must provide either id or code');
  }

  /** @see IRuleApiClient.updateRule */
  async updateRule(ruleId: string, req: UpdateRuleReq): Promise<Result<UpdateRuleRes>> {
    return this.httpClient.patch(`${this.baseUrl}/${ruleId}`, req);
  }

  /** @see IRuleApiClient.deleteRule */
  async deleteRule(req: DeleteRuleReq): Promise<Result<DeleteRuleRes>> {
    return this.httpClient.delete(`${this.baseUrl}/${req.id}`);
  }

  /** @see IRuleApiClient.listRules */
  async listRules(query?: ListRulesQuery): Promise<Result<ListRulesRes>> {
    return this.httpClient.get(this.baseUrl, { params: query });
  }

  /** @see IRuleApiClient.searchRules */
  async searchRules(query: SearchRulesQuery): Promise<Result<SearchRulesRes>> {
    return this.httpClient.get(`${this.baseUrl}/search`, { params: query });
  }

  /** @see IRuleApiClient.getRevisions */
  async getRevisions(query: GetRuleRevisionsQuery): Promise<Result<GetRuleRevisionsRes>> {
    return this.httpClient.get(`${this.baseUrl}/${query.ruleId}/revisions`, {
      params: {
        page: query.page,
        pageSize: query.pageSize,
      },
    });
  }
}

export function createRuleHttpAdapter(httpClient: IResultHttpClient): IRuleApiClient {
  return new RuleHttpAdapter(httpClient);
}
