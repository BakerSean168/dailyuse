/**
 * Rule HTTP Adapter.
 * 规则 HTTP 适配器。
 *
 * HTTP implementation of IRuleApiClient.
 * IRuleApiClient 的 HTTP 实现。
 * Implements rule API operations using HTTP REST calls.
 * 使用 HTTP REST 调用实现规则 API 操作。
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

  async createRule(req: CreateRuleReq): Promise<Result<CreateRuleRes>> {
    return this.httpClient.post(this.baseUrl, req);
  }

  async getRule(req: GetRuleReq): Promise<Result<GetRuleRes>> {
    if (req.id) {
      return this.httpClient.get(`${this.baseUrl}/${req.id}`);
    } else if (req.code) {
      return this.httpClient.get(`${this.baseUrl}/by-code/${req.code}`);
    }
    return error('VALIDATION_ERROR', 'Must provide either id or code');
  }

  async updateRule(ruleId: string, req: UpdateRuleReq): Promise<Result<UpdateRuleRes>> {
    return this.httpClient.patch(`${this.baseUrl}/${ruleId}`, req);
  }

  async deleteRule(req: DeleteRuleReq): Promise<Result<DeleteRuleRes>> {
    return this.httpClient.delete(`${this.baseUrl}/${req.id}`);
  }

  async listRules(query?: ListRulesQuery): Promise<Result<ListRulesRes>> {
    return this.httpClient.get(this.baseUrl, { params: query });
  }

  async searchRules(query: SearchRulesQuery): Promise<Result<SearchRulesRes>> {
    return this.httpClient.get(`${this.baseUrl}/search`, { params: query });
  }

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
