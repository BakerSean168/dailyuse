// Event patterns - base event handler and dispatcher
// To be populated with BaseEventHandler and EventDispatcher

import type { IDomainEvent } from '@dailyuse/contracts/shared';

/**
 * Event handler type
 */
export type EventHandler<T = any> = (event: T) => void | Promise<void>;

/**
 * Event emitter interface
 */
export interface IEventEmitter {
  on(eventName: string, handler: EventHandler): void;
  once(eventName: string, handler: EventHandler): void;
  off(eventName: string, handler: EventHandler): void;
  emit(eventName: string, data?: any): Promise<void>;
  removeAllListeners(eventName?: string): void;
}

/**
 * 重新导出已有的领域事件接口
 * 统一使用 @dailyuse/contracts/shared 中的 IDomainEvent
 */
export type { IDomainEvent };

/**
 * EventBus 接口 - 用于发布领域事件
 * 
 * 职责：
 * - 发布领域事件到事件总线
 * - 支持同步和异步处理
 * 
 * 【设计说明】
 * 使用项目已有的 IDomainEvent 接口 (来自 @dailyuse/contracts/shared)
 * 字段包括：eventType, payload, aggregateId, occurredAt
 */
export interface IEventBus {
  /**
   * 发布领域事件
   * @param event 领域事件对象（使用 IDomainEvent 接口）
   */
  publish<T extends IDomainEvent>(event: T): Promise<void>;

  /**
   * 发送事件（可选的简化 API）
   * @param eventType 事件类型
   * @param payload 事件负载
   */
  send?(eventType: string, payload: any): Promise<void>;
}