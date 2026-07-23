/**
 * Governance Module - Aggregates Export
 * 规则治理模块 - 聚合根导出
 *
 * Residual 651: rule server dual retired (RuleClientDTO only).
 * API / domain toClientDTO() use RuleClientDTO exclusively.
 */

// ============ Client Aggregate (前端/外部消费者) ============
export type { RuleClientDTO } from './rule-client';
