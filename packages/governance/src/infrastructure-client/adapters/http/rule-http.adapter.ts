/**
 * Rule HTTP Adapter
 *
 * HTTP implementation of IRuleApiClient.
 * Implements rule API operations using HTTP REST calls.
 */

import type {
  IRuleApiClient,
  IHttpClient,
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
  private readonly baseUrl = '/api/governance/rules';

  constructor(private readonly httpClient: IHttpClient) {}

  // ===== Rule CRUD =====

  async createRule(req: CreateRuleReq): Promise<CreateRuleRes> {
    return this.httpClient.post(this.baseUrl, req);
  }

  async getRule(req: GetRuleReq): Promise<GetRuleRes> {
    if (req.id) {
      return this.httpClient.get(`${this.baseUrl}/${req.id}`);
    } else if (req.code) {
      return this.httpClient.get(`${this.baseUrl}/by-code/${req.code}`);
    }
    throw new Error('Must provide either id or code');
  }

  async updateRule(ruleId: string, req: UpdateRuleReq): Promise<UpdateRuleRes> {
    return this.httpClient.patch(`${this.baseUrl}/${ruleId}`, req);
  }

  async deleteRule(req: DeleteRuleReq): Promise<DeleteRuleRes> {
    return this.httpClient.delete(`${this.baseUrl}/${req.id}`);
  }

  async listRules(query?: ListRulesQuery): Promise<ListRulesRes> {
    return this.httpClient.get(this.baseUrl, { params: query });
  }

  async searchRules(query: SearchRulesQuery): Promise<SearchRulesRes> {
    return this.httpClient.get(`${this.baseUrl}/search`, { params: query });
  }
}

export function createRuleHttpAdapter(httpClient: IHttpClient): IRuleApiClient {
  return new RuleHttpAdapter(httpClient);
}
