/**
 * Rule HTTP Adapter
 *
 * HTTP implementation of IRuleApiClient.
 * Implements rule API operations using HTTP REST calls.
 */

import type { Result } from '@dailyuse/contracts/result';
import { fail } from '@dailyuse/contracts/result';
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
} from '../types';

/**
 * Rule HTTP Adapter
 *
 * Implements IRuleApiClient using HTTP REST API calls.
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
    return fail({ code: 'VALIDATION_ERROR', message: 'Must provide either id or code' });
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
}

export function createRuleHttpAdapter(httpClient: IResultHttpClient): IRuleApiClient {
  return new RuleHttpAdapter(httpClient);
}
