import { eventBus, type DomainEvent } from '@dailyuse/utils';
import { DashboardContainer } from '@dailyuse/infrastructure-server';

/**
 * Dashboard 领域事件监听器
 * 负责：
 * 1. 监听各模块的统计更新事件
 * 2. 自动失效对应账户的仪表盘缓存
 * 3. 记录缓存失效日志
 */
export class DashboardEventListener {
  private static isInitialized = false;

  /**
   * 初始化事件监听器（在应用启动时调用一次）
   */
  static async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('⚠️  [DashboardEventListener] Already initialized, skipping...');
      return;
    }

    console.log('🚀 [DashboardEventListener] Initializing Dashboard event listeners...');

    const container = DashboardContainer.getInstance();
    const cacheService = container.getCacheService();

    // ============ 监听 Task 模块统计更新事件 ============

    /**
     * 监听 Task 统计更新事件
     */
    eventBus.on('task.statistics.updated', async (event: DomainEvent) => {
      try {
        const accountUuid = event.accountUuid || (event.payload as any)?.accountUuid;
        if (!accountUuid) {
          console.error(
            '❌ [DashboardEventListener] Missing accountUuid in task.statistics.updated event',
          );
          return;
        }

        console.log(
          `📊 [DashboardEventListener] Task statistics updated for account: ${accountUuid}`,
        );
        await cacheService.invalidate(accountUuid);
        console.log(`🗑️ [DashboardEventListener] Cache invalidated for account: ${accountUuid}`);
      } catch (error) {
        console.error('❌ [DashboardEventListener] Error handling task.statistics.updated:', error);
      }
    });

    /**
     * 监听 Task 统计重算事件
     */
    eventBus.on('task.statistics.recalculated', async (event: DomainEvent) => {
      try {
        const accountUuid = event.accountUuid || (event.payload as any)?.accountUuid;
        if (!accountUuid) {
          console.error(
            '❌ [DashboardEventListener] Missing accountUuid in task.statistics.recalculated event',
          );
          return;
        }

        console.log(
          `📊 [DashboardEventListener] Task statistics recalculated for account: ${accountUuid}`,
        );
        await cacheService.invalidate(accountUuid);
        console.log(`🗑️ [DashboardEventListener] Cache invalidated for account: ${accountUuid}`);
      } catch (error) {
        console.error(
          '❌ [DashboardEventListener] Error handling task.statistics.recalculated:',
          error,
        );
      }
    });

    // ============ 监听 Goal 模块统计更新事件 ============

    /**
     * 监听 Goal 统计重算事件
     */
    eventBus.on('goal_statistics.recalculated', async (event: DomainEvent) => {
      try {
        const accountUuid = event.accountUuid || (event.payload as any)?.accountUuid;
        if (!accountUuid) {
          console.error(
            '❌ [DashboardEventListener] Missing accountUuid in goal_statistics.recalculated event',
          );
          return;
        }

        console.log(
          `📊 [DashboardEventListener] Goal statistics recalculated for account: ${accountUuid}`,
        );
        await cacheService.invalidate(accountUuid);
        console.log(`🗑️ [DashboardEventListener] Cache invalidated for account: ${accountUuid}`);
      } catch (error) {
        console.error(
          '❌ [DashboardEventListener] Error handling goal_statistics.recalculated:',
          error,
        );
      }
    });

    // ============ 监听 Reminder 模块统计更新事件 ============

    /**
     * 监听 Reminder 统计更新事件
     */
    eventBus.on('ReminderStatisticsUpdated', async (event: DomainEvent) => {
      try {
        const accountUuid = event.accountUuid || (event.payload as any)?.accountUuid;
        if (!accountUuid) {
          console.error(
            '❌ [DashboardEventListener] Missing accountUuid in ReminderStatisticsUpdated event',
          );
          return;
        }

        console.log(
          `📊 [DashboardEventListener] Reminder statistics updated for account: ${accountUuid}`,
        );
        await cacheService.invalidate(accountUuid);
        console.log(`🗑️ [DashboardEventListener] Cache invalidated for account: ${accountUuid}`);
      } catch (error) {
        console.error(
          '❌ [DashboardEventListener] Error handling ReminderStatisticsUpdated:',
          error,
        );
      }
    });

    // ============ 监听 Schedule 模块统计更新事件 ============

    /**
     * 监听 Schedule 统计执行记录事件
     */
    eventBus.on('ScheduleStatisticsExecutionRecorded', async (event: DomainEvent) => {
      try {
        const accountUuid = event.accountUuid || (event.payload as any)?.accountUuid;
        if (!accountUuid) {
          console.error(
            '❌ [DashboardEventListener] Missing accountUuid in ScheduleStatisticsExecutionRecorded event',
          );
          return;
        }

        console.log(
          `📊 [DashboardEventListener] Schedule statistics execution recorded for account: ${accountUuid}`,
        );
        await cacheService.invalidate(accountUuid);
        console.log(`🗑️ [DashboardEventListener] Cache invalidated for account: ${accountUuid}`);
      } catch (error) {
        console.error(
          '❌ [DashboardEventListener] Error handling ScheduleStatisticsExecutionRecorded:',
          error,
        );
      }
    });

    this.isInitialized = true;
    console.log('✅ [DashboardEventListener] Dashboard event listeners registered successfully');
  }

  /**
   * 重置状态（主要用于测试）
   */
  static reset(): void {
    this.isInitialized = false;
  }

  /**
   * 检查是否已初始化
   */
  static isReady(): boolean {
    return this.isInitialized;
  }
}
