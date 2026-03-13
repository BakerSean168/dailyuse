/**
 * Governance Module - Value Objects Export. 治理模块 - 值对象导出。
 *
 * 【规范说明：value-objects模块导出】
 * - 使用 详细命名导出 模式
 * 注意只需要直接导出。如 export { ExampleStatus } from './example-status'; 不需要重复导出类型：export type { ExampleStatus };
 */

// ============ Governance Value Objects ============
export { RuleId } from './rule-id';
export { RuleRevisionId } from './rule-revision-id';
export { RuleTag } from './rule-tag';
export { CodeSnippet } from './code-snippet';
export { Language } from './language';
export { SnippetType } from './snippet-type';
export { RuleStatus } from './rule-status';
export { RuleSeverity } from './rule-severity';
