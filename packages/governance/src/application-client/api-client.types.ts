/**
 * Rule API Client Interface
 * 规则 API 客户端接口
 */

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
 * Rule API Client Interface
 * 
 * 定义规则模块所有 API 操作
 */
export interface IRuleApiClient {
  /**
   * 创建规则
   */
  createRule(req: CreateRuleReq): Promise<CreateRuleRes>;

  /**
   * 获取单个规则（通过 ID 或 code）
   */
  getRule(req: GetRuleReq): Promise<GetRuleRes>;

  /**
   * 更新规则
   */
  updateRule(ruleId: string, req: UpdateRuleReq): Promise<UpdateRuleRes>;

  /**
   * 删除规则
   */
  deleteRule(req: DeleteRuleReq): Promise<DeleteRuleRes>;

  /**
   * 列出规则（带过滤和分页）
   */
  listRules(query?: ListRulesQuery): Promise<ListRulesRes>;

  /**
   * 搜索规则（关键词搜索）
   */
  searchRules(query: SearchRulesQuery): Promise<SearchRulesRes>;
}
