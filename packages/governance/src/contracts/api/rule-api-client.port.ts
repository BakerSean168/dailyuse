/**
 * Rule API Client Port Interface
 * 规则 API 客户端接口
 * 
 * Defines the contract for Rule API operations.
 * Implementations: RuleHttpAdapter (web), RuleIpcAdapter (desktop)
 */

import type { Result } from '@dailyuse/contracts/result';
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
} from './rules';

/**
 * Rule API Client Interface
 * 
 * 定义规则模块所有 API 操作
 */
export interface IRuleApiClient {
  /**
   * 创建规则
   */
  createRule(req: CreateRuleReq): Promise<Result<CreateRuleRes>>;

  /**
   * 获取单个规则（通过 ID 或 code）
   */
  getRule(req: GetRuleReq): Promise<Result<GetRuleRes>>;

  /**
   * 更新规则
   */
  updateRule(ruleId: string, req: UpdateRuleReq): Promise<Result<UpdateRuleRes>>;

  /**
   * 删除规则
   */
  deleteRule(req: DeleteRuleReq): Promise<Result<DeleteRuleRes>>;

  /**
   * 列出规则（带过滤和分页）
   */
  listRules(query?: ListRulesQuery): Promise<Result<ListRulesRes>>;

  /**
   * 搜索规则（关键词搜索）
   */
  searchRules(query: SearchRulesQuery): Promise<Result<SearchRulesRes>>;
}
