/**
 * Rule API Client Port Interface.
 * 规则 API 客户端端口接口。
 *
 * Defines the contract for Rule API operations.
 * Implementations: RuleHttpAdapter (web), RuleIpcAdapter (desktop).
 * 定义规则 API 操作的契约。
 * 实现：RuleHttpAdapter（Web 端）、RuleIpcAdapter（桌面端）。
 *
 * Note: Parameters use plain string IDs (not branded) because this is
 * an API boundary — values are serialized over HTTP/IPC.
 * 注意：参数使用普通字符串 ID（非品牌类型），因为这是 API 边界 — 值通过 HTTP/IPC 序列化。
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
 * Rule API Client Interface.
 * 规则 API 客户端接口。
 *
 * All methods return Result<T> for consistent error handling across transports.
 * 所有方法返回 Result<T>，确保跨传输层的一致错误处理。
 */
export interface IRuleApiClient {
  /** Create a new rule. 创建新规则。 */
  createRule(req: CreateRuleReq): Promise<Result<CreateRuleRes>>;

  /** Get a single rule by ID or code. 通过 ID 或 code 获取单个规则。 */
  getRule(req: GetRuleReq): Promise<Result<GetRuleRes>>;

  /** Update rule fields (PATCH semantics). 更新规则字段（PATCH 语义）。 */
  updateRule(ruleId: string, req: UpdateRuleReq): Promise<Result<UpdateRuleRes>>;

  /** Delete a rule. 删除规则。 */
  deleteRule(req: DeleteRuleReq): Promise<Result<DeleteRuleRes>>;

  /** List rules with optional filters and pagination. 列出规则（带过滤和分页）。 */
  listRules(query?: ListRulesQuery): Promise<Result<ListRulesRes>>;

  /** Search rules by keyword. 关键词搜索规则。 */
  searchRules(query: SearchRulesQuery): Promise<Result<SearchRulesRes>>;
}
