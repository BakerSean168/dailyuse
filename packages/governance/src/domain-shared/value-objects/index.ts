/**
 * Governance Module - Value Objects Export. 治理模块 - 值对象导出。
 *
 * 【规范说明：显式命名导出】
 * 使用 `export { X } from './file'` 而非 `export * from './file'`：
 * - 防止意外泄露内部类型（如 @internal 标记的 PersistenceDTO）
 * - 导出列表即文档——一眼看出暴露了哪些公共 API
 * - 重构时更容易追踪依赖
 *
 * 注意只需要直接导出。如 export { ExampleStatus } from './example-status';
 * 不需要重复导出类型：export type { ExampleStatus };
 */

// ============ Governance Value Objects ============
export { RuleId } from './rule-id';
export { RuleRevisionId } from './rule-revision-id';
export { RuleTag } from './rule-tag';
export { CodeSnippet } from './code-snippet';
/** @internal Persistence format — use CodeSnippetDTO instead. 持久化格式 — 请使用 CodeSnippetDTO。 */
export type { CodeSnippetPersistenceDTO } from './code-snippet';
export { Language } from './language';
export { SnippetType } from './snippet-type';
export { ChangeType } from './change-type';
export { RuleStatus } from './rule-status';
export { RuleSeverity } from './rule-severity';
