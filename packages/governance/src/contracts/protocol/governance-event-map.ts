import type {
  RuleCreatedEvent,
  RuleUpdatedEvent,
  RuleDeprecatedEvent,
  RuleReactivatedEvent,
  RuleStatusChangedEvent,
} from '../domain/events';

/**
 * Governance Module - Event Map
 * 规则治理模块 - 事件映射
 * 
 * 【规范说明：事件映射】
 * 定义模块发出的所有领域事件，用于模块间异步通信。
 * 
 * 【事件命名规范】
 * 格式：{module}:{action}
 * - governance:rule-created - 规则创建
 * - governance:rule-updated - 规则更新
 * - governance:rule-deprecated - 规则废弃
 * - governance:rule-reactivated - 规则重新激活
 * - governance:rule-status-changed - 规则状态变更（通用）
 * 
 * 【使用场景】
 * - 事件发布：eventBus.publish('governance:rule-created', payload)
 * - 事件订阅：eventBus.subscribe('governance:rule-created', handler)
 * 
 * utils 的 addDomainEvent 能接收 type 和 payload，自动生成 aggregateId 和 occurredAt，
 * 所以 Event 中不需要包含这些字段
 */
export type GovernanceEventMap = {
  /**
   * 规则创建事件
   * 新规则创建成功后发出
   */
  'governance:rule-created': RuleCreatedEvent;

  /**
   * 规则更新事件
   * 规则内容更新后发出
   */
  'governance:rule-updated': RuleUpdatedEvent;

  /**
   * 规则废弃事件
   * 规则被废弃后发出
   */
  'governance:rule-deprecated': RuleDeprecatedEvent;

  /**
   * 规则重新激活事件
   * 已废弃的规则重新激活后发出
   */
  'governance:rule-reactivated': RuleReactivatedEvent;

  /**
   * 规则状态变更事件（通用）
   * 规则状态发生任何变更时发出
   */
  'governance:rule-status-changed': RuleStatusChangedEvent;
};
