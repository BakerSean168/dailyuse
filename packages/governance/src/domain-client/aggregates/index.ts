/**
 * Governance Aggregates - Domain Client
 * 规则治理模块聚合根导出 - 领域客户端
 * 
 * domain-client 的聚合根特点：
 * - Anemic Domain Model + Rich View Model
 * - 专注于 UI 辅助和展示逻辑
 * - 使用 load() 从状态创建
 */

export { Rule } from './rule';
export type { RuleState } from './rule';
