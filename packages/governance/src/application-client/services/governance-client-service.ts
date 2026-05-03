/**
 * Governance Client Service
 * 治理客户端服务
 *
 * Thin application-layer facade for governance client operations.
 * It wraps the transport-level `IRuleApiClient` and returns DTOs directly,
 * leaving Pinia stores to cache POJO data and UI composables to hydrate
 * domain-client entities only when needed.
 * 治理客户端操作的轻量应用层门面。
 * 它封装传输层 `IRuleApiClient` 并直接返回 DTO，
 * 由 Pinia Store 缓存 POJO 数据，UI composable 在确有需要时再水化客户端领域实体。
 */

import type { Result } from '@dailyuse/contracts/result';
import type { RuleClientDTO } from '../../contracts/aggregates/rule-client';
import type {
  CreateRuleReq,
  DeleteRuleRes,
  GetRuleRevisionsQuery,
  GetRuleRevisionsRes,
  ListRulesQuery,
  ListRulesRes,
  SearchRulesQuery,
  SearchRulesRes,
  UpdateRuleReq,
} from '../../contracts/api';
import type { IRuleApiClient } from '../../contracts/api/rule-api-client.port';

// ─── Client Application Port ────────────────────────────────────────────────

/** High-level client-side operations for the governance module. */
export interface GovernanceClientPort {
  createRule(req: CreateRuleReq): Promise<Result<RuleClientDTO>>;
  getRule(req: { id: string } | { code: string }): Promise<Result<RuleClientDTO>>;
  updateRule(ruleId: string, req: UpdateRuleReq): Promise<Result<RuleClientDTO>>;
  deleteRule(req: { id: string }): Promise<Result<DeleteRuleRes>>;
  listRules(query?: ListRulesQuery): Promise<Result<ListRulesRes>>;
  searchRules(query: SearchRulesQuery): Promise<Result<SearchRulesRes>>;
  getRevisions(query: GetRuleRevisionsQuery): Promise<Result<GetRuleRevisionsRes>>;
}

/** Governance frontend service facade. 治理前端服务门面。 */
export class GovernanceClientService implements GovernanceClientPort {
  constructor(private readonly ruleApiClient: IRuleApiClient) {
    this.createRule = this.createRule.bind(this);
    this.getRule = this.getRule.bind(this);
    this.updateRule = this.updateRule.bind(this);
    this.deleteRule = this.deleteRule.bind(this);
    this.listRules = this.listRules.bind(this);
    this.searchRules = this.searchRules.bind(this);
    this.getRevisions = this.getRevisions.bind(this);
  }

  /** Creates a rule and returns DTO directly. 创建规则并直接返回 DTO。 */
  async createRule(req: CreateRuleReq): Promise<Result<RuleClientDTO>> {
    return this.ruleApiClient.createRule(req);
  }

  /** Gets a rule by ID or code. 通过 ID 或 code 获取规则。 */
  async getRule(req: { id: string } | { code: string }): Promise<Result<RuleClientDTO>> {
    return this.ruleApiClient.getRule(req as Parameters<IRuleApiClient['getRule']>[0]);
  }

  /** Updates a rule and returns DTO directly. 更新规则并直接返回 DTO。 */
  async updateRule(ruleId: string, req: UpdateRuleReq): Promise<Result<RuleClientDTO>> {
    return this.ruleApiClient.updateRule(ruleId, req);
  }

  /** Deletes a rule. 删除规则。 */
  async deleteRule(req: { id: string }): Promise<Result<DeleteRuleRes>> {
    return this.ruleApiClient.deleteRule(req as Parameters<IRuleApiClient['deleteRule']>[0]);
  }

  /** Lists rules with filters and pagination. 按过滤与分页列出规则。 */
  async listRules(query?: ListRulesQuery): Promise<Result<ListRulesRes>> {
    return this.ruleApiClient.listRules(query);
  }

  /** Searches rules by keyword. 按关键词搜索规则。 */
  async searchRules(query: SearchRulesQuery): Promise<Result<SearchRulesRes>> {
    return this.ruleApiClient.searchRules(query);
  }

  /** Gets revision history for a rule. 获取规则修订历史。 */
  async getRevisions(query: GetRuleRevisionsQuery): Promise<Result<GetRuleRevisionsRes>> {
    return this.ruleApiClient.getRevisions(query);
  }
}

// ─── Factory ─────────────────────────────────────────────────────────────────

/** Create a `GovernanceClientService` from any transport adapter. */
export function createGovernanceClientService(ruleApiClient: IRuleApiClient): GovernanceClientService {
  return new GovernanceClientService(ruleApiClient);
}
