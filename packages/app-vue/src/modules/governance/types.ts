/**
 * Governance Module — Re-exported Types
 *
 * 从 @dailyuse/governance/contracts 重新导出所有客户端需要的类型。
 * 这样模块内部可以用短路径 `../types` 引用。
 */

export type { RuleClientDTO, RuleRevisionClientDTO } from '@dailyuse/governance/contracts';

export type { RuleStatus, RuleSeverity } from '@dailyuse/governance/contracts';

export type {
  CreateRuleReq,
  UpdateRuleReq,
  ListRulesQuery,
  SearchRulesQuery,
} from '@dailyuse/governance/contracts';
