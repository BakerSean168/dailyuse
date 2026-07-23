/**
 * Governance Module - Value Objects Export.
 * 规则治理模块 - 值对象导出。
 */

// ============ Governance Value Objects ============
export { RuleStatus } from './rule-status';
export { RuleSeverity } from './rule-severity';
export { Language } from './language';
export { SnippetType } from './snippet-type';
export { ChangeType } from './change-type';
export { CodeSnippetDTOSchema } from './code-snippet';
export type { CodeSnippetDTO } from './code-snippet';
/** @internal Persistence format — use CodeSnippetDTO instead. 持久化格式 — 请使用 CodeSnippetDTO。 */
export type { CodeSnippetPersistenceDTO } from './code-snippet';
export { RuleTagDTOSchema } from './rule-tag';
export type { RuleTagDTO } from './rule-tag';
