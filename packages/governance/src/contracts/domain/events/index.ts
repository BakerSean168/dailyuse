/**
 * Example Module - Domain Events
 * 
 * 【规范说明：领域事件导出】
 * 领域事件是 DDD 中的重要概念，用于模块间解耦通信
 * 
 * 【事件命名规范】
 * - 使用过去时态：Created, Deleted, Updated
 * - 包含聚合根名称：ExampleCreatedEvent
 * - 后缀使用 Event
 */

// ============ Events ============
/**
 * Governance Module - Domain Events
 * 规则治理模块 - 领域事件导出
 */

// Rule Events
export type { RuleCreatedEvent } from './rule-created.event';
export type { RuleUpdatedEvent } from './rule-updated.event';
export type { RuleDeprecatedEvent } from './rule-deprecated.event';
export type { RuleReactivatedEvent } from './rule-reactivated.event';
export type { RuleStatusChangedEvent } from './rule-status-changed.event';

// Legacy Example Events (待清理)
export type { ExampleCreatedEvent } from './example-created.event';
export type { ExampleDeletedEvent } from './example-deleted.event';
export type { ExampleStatusChangedEvent } from './example-status-changed.event';

/**
 * 所有 Example 模块领域事件的联合类型
 * 用于事件处理器的类型推断
 */
export type ExampleDomainEvent =
  | import('./example-created.event').ExampleCreatedEvent
  | import('./example-deleted.event').ExampleDeletedEvent
  | import('./example-status-changed.event').ExampleStatusChangedEvent;