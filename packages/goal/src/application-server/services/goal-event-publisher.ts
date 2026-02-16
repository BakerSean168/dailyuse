import { eventBus } from '@dailyuse/utils';
import type { IDomainEvent } from '@dailyuse/contracts/shared';

/**
 * Goal 领域事件发布器
 * 仅负责事件转发，不再维护统计服务。
 */
export class GoalEventPublisher {
  private static isInitialized = false;

  static async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    const forward = (_event: IDomainEvent): void => {
      // 统计服务已移除，暂不执行统计更新逻辑。
    };

    eventBus.on('goal.created', forward);
    eventBus.on('goal.deleted', forward);
    eventBus.on('goal.status_changed', forward);
    eventBus.on('goal.completed', forward);
    eventBus.on('goal.archived', forward);
    eventBus.on('goal.activated', forward);
    eventBus.on('key_result.created', forward);
    eventBus.on('key_result.updated', forward);
    eventBus.on('key_result.deleted', forward);
    eventBus.on('key_result.completed', forward);
    eventBus.on('goal.review_created', forward);
    eventBus.on('goal.review_updated', forward);
    eventBus.on('goal.review_deleted', forward);

    this.isInitialized = true;
  }

  /**
   * Publish domain events accumulated on a Goal entity.
   * Currently a no-op — event forwarding is handled by the bus listeners above.
   */
  static async publishGoalEvents(_goal: unknown): Promise<void> {
    // Placeholder — statistics service was removed.
    // Individual event bus listeners are set up in initialize().
  }
}
