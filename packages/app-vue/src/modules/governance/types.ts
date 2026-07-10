/**
 * Governance Module — Re-exported Types
 *
 * 从 @dailyuse/contracts/governance 重新导出前端治理模块常用类型。
 * 模块内部继续使用短路径 `../types`，但公共契约只保留一个来源。
 */

export type { RuleClientDTO, RuleRevisionClientDTO } from '@dailyuse/contracts/governance';

export type { RuleStatus, RuleSeverity } from '@dailyuse/contracts/governance';

export type { RuleId } from '@dailyuse/contracts/governance';

export type {
  CreateRuleReq,
  UpdateRuleReq,
  ListRulesQuery,
  SearchRulesQuery,
} from '@dailyuse/contracts/governance';
