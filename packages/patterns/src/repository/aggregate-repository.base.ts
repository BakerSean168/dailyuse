/**
 * AggregateRepository Base Class
 * 
 * 提供领域事件自动发送的基础能力
 * 所有聚合根仓储建议继承此基类
 * 
 * 【设计说明】
 * 使用 Template Method 模式：
 * - save() 定义算法骨架：先持久化，再发送事件
 * - persist() 由子类实现具体的持久化逻辑
 * - publishDomainEvents() 自动处理事件发送
 * 
 * 【事件处理】
 * 使用 AggregateRoot.domainEvents 属性获取事件
 * 使用 AggregateRoot.clearDomainEvents() 清理已发送的事件
 */

import type { AggregateRoot } from '@dailyuse/utils';
import type { IEventBus } from '../events';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('AggregateRepository');

export interface IAggregateRepository<T extends AggregateRoot<any>> {
  save(aggregate: T): Promise<void>;
}

/**
 * 聚合根仓储抽象基类
 * 
 * 职责：
 * 1. 在持久化成功后自动发送领域事件
 * 2. 处理事件发送失败的情况
 * 3. 提供统一的错误处理模式
 */
export abstract class AggregateRepositoryBase<T extends AggregateRoot<any>>
  implements IAggregateRepository<T>
{
  constructor(protected readonly eventBus: IEventBus) {}

  /**
   * 保存聚合根（模板方法）
   * 
   * 流程：
   * 1. 调用子类的 persist() 完成持久化
   * 2. 持久化成功后，自动发送领域事件
   * 3. 清理已发送的事件
   */
  async save(aggregate: T): Promise<void> {
    try {
      // 1. 执行持久化（子类实现）
      await this.persist(aggregate);

      // 2. 持久化成功后，发送领域事件
      await this.publishDomainEvents(aggregate);

      logger.debug('[AggregateRepository] Aggregate saved and events published', {
        aggregateId: aggregate.id,
        eventCount: aggregate.domainEvents.length,
      });
    } catch (error) {
      logger.error('[AggregateRepository] Failed to save aggregate', {
        aggregateId: aggregate.id,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * 持久化聚合根（由子类实现）
   * 
   * 子类应该在这里实现具体的数据持久化逻辑
   * 不需要关心事件发送，基类会自动处理
   */
  protected abstract persist(aggregate: T): Promise<void>;

  /**
   * 发送领域事件
   * 
   * 策略：
   * - 在事务提交后发送，确保数据已持久化
   * - 事件发送失败不回滚事务，记录错误日志
   * - 可以通过事件溯源或重试机制保证最终一致性
   */
  private async publishDomainEvents(aggregate: T): Promise<void> {
    const events = aggregate.domainEvents;
    
    if (events.length === 0) {
      return;
    }

    for (const event of events) {
      try {
        // 使用 eventBus.send 而不是 publish
        // 根据你们的 eventBus 实现调整
        await this.eventBus.publish(event);
        
        logger.debug('[AggregateRepository] Event published', {
          eventType: event.eventType,
          aggregateId: aggregate.id,
        });
      } catch (error) {
        // 事件发送失败：记录错误但不中断流程
        // 可以考虑写入失败队列，稍后重试
        logger.error('[AggregateRepository] Failed to publish event', {
          eventType: event.eventType,
          aggregateId: aggregate.id,
          error: error instanceof Error ? error.message : String(error),
        });
        
        // 可选：将失败事件存储到专用表，用于后续重试
        // await this.storeFailedEvent(event, error);
      }
    }

    // 清理已发送的事件
    aggregate.clearDomainEvents();
  }

  /**
   * （可选）存储发送失败的事件
   * 
   * 用于实现事件重试机制
   */
  // protected async storeFailedEvent(event: DomainEvent, error: Error): Promise<void> {
  //   // 实现：将失败事件存入专用表
  //   // 可以由后台任务定期重试
  // }
}
