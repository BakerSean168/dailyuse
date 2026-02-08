import type {
  ExampleCreatedEvent,
  ExampleDeletedEvent,
  ExampleStatusChangedEvent,
} from '../domain/events';

/**
 * Example Module - Event Map
 * 
 * 【规范说明：事件映射】
 * 定义模块发出的所有领域事件，用于模块间异步通信。
 * 
 * 【事件命名规范】
 * 格式：{module}:{action}
 * - example:created - Example 创建
 * - example:deleted - Example 删除
 * - example:status-changed - Example 状态变更
 * 
 * 【使用场景】
 * - 事件发布：eventBus.publish('example:created', payload)
 * - 事件订阅：eventBus.subscribe('example:created', handler)
 * 
 *  utils 的 addDomainEvent 能接收 type 和 payload，自动生成 aggregateId 和 occurredAt，所以Event 中不需要包含这些字段
 */
export type ExampleEventMap = {
  /**
   * Example 创建事件
   * 新 Example 创建成功后发出
   */
  'example:created': ExampleCreatedEvent;

  /**
   * Example 删除事件
   * Example 删除后发出
   */
  'example:deleted': ExampleDeletedEvent;

  /**
   * Example 状态变更事件
   * Example 状态转换完成后发出
   */
  'example:status-changed': ExampleStatusChangedEvent;
};

