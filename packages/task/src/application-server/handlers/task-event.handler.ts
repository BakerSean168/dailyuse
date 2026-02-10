import { eventBus, Logger } from '@dailyuse/utils';
import type { IDomainEvent } from '@dailyuse/contracts/shared';

const logger = new Logger('TaskEventHandler');

// Cast eventBus to any for custom event types not in AppEventRegistry
const customEventBus = eventBus as any;

/**
 * Task 模块事件处理器
 * 负责：
 * 1. 监听 Task 模块的领域事件
 * 2. 通过 SSE 推送给前端
 * 3. 实现任务实例的实时同步
 */
export class TaskEventHandler {
  private static isInitialized = false;

  /**
   * 初始化事件监听器（在应用启动时调用一次）
   */
  static async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('⚠️ [TaskEventHandler] Already initialized, skipping');
      return;
    }

    console.log('🎧 [TaskEventHandler] Initializing event listeners...');

    /**
     * 监听 Task 实例生成事件
     */
    customEventBus.on('task.instances.generated', async (event: IDomainEvent) => {
      try {
        await this.handleTaskInstancesGenerated(event);
      } catch (error) {
        logger.error('[TaskEventHandler] Error handling task.instances.generated:', error);
      }
    });

    /**
     * 监听 Task 模板创建事件
     */
    customEventBus.on('task.template.created', async (event: IDomainEvent) => {
      try {
        await this.handleTaskTemplateCreated(event);
      } catch (error) {
        logger.error('[TaskEventHandler] Error handling task.template.created:', error);
      }
    });

    /**
     * 监听 Task 实例完成事件
     */
    customEventBus.on('task.instance.completed', async (event: IDomainEvent) => {
      try {
        await this.handleTaskInstanceCompleted(event);
      } catch (error) {
        logger.error('[TaskEventHandler] Error handling task.instance.completed:', error);
      }
    });

    this.isInitialized = true;
    console.log('✅ [TaskEventHandler] Event listeners initialized');
  }

  /**
   * 处理任务实例生成事件
   */
  private static async handleTaskInstancesGenerated(event: IDomainEvent): Promise<void> {
    const eventData = event as any;
    const accountUuid = eventData.accountUuid ?? eventData.payload?.accountUuid;

    if (!accountUuid) {
      logger.error('[TaskEventHandler] Missing accountUuid in task.instances.generated event');
      return;
    }

    const { templateUuid, templateTitle, instanceCount, instances, dateRange, strategy } =
      eventData.payload ?? eventData;

    logger.info('📦 [TaskEventHandler] Task instances generated', {
      accountUuid,
      templateUuid,
      templateTitle,
      instanceCount,
      strategy,
    });

    // TODO: 通过 SSE 推送给前端 - 应该通过事件总线由 infrastructure 层处理
    // SSE 推送代码已移除，应该在 infrastructure 层通过监听领域事件来实现
  }

  /**
   * 处理任务模板创建事件
   */
  private static async handleTaskTemplateCreated(event: IDomainEvent): Promise<void> {
    const { accountUuid, payload } = event as any;

    if (!accountUuid) {
      return;
    }

    logger.info('📝 [TaskEventHandler] Task template created', {
      accountUuid,
      templateUuid: payload.templateUuid,
    });

    // TODO: 推送给前端 - 应该通过事件总线由 infrastructure 层处理
    // try {
    //   const { SSEConnectionManager } = await import('../../../notification/interface/sseRoutes');
    //   const sseManager = SSEConnectionManager.getInstance();
    //
    //   sseManager.sendMessage(accountUuid, 'task:template-created', {
    //     template: payload.template,
    //     timestamp: new Date().toISOString(),
    //   });
    // } catch (error) {
    //   logger.error('[TaskEventHandler] Failed to send SSE message:', error);
    // }
  }

  /**
   * 处理任务实例完成事件
   */
  private static async handleTaskInstanceCompleted(event: IDomainEvent): Promise<void> {
    const { accountUuid, payload } = event as any;

    if (!accountUuid) {
      return;
    }

    logger.info('✅ [TaskEventHandler] Task instance completed', {
      accountUuid,
      instanceUuid: payload.instanceUuid,
    });

    // TODO: 推送给前端 - 应该通过事件总线由 infrastructure 层处理
    // try {
    //   const { SSEConnectionManager } = await import('../../../notification/interface/sseRoutes');
    //   const sseManager = SSEConnectionManager.getInstance();
    //
    //   sseManager.sendMessage(accountUuid, 'task:instance-completed', {
    //     instance: payload.instance,
    //     timestamp: new Date().toISOString(),
    //   });
    // } catch (error) {
    //   logger.error('[TaskEventHandler] Failed to send SSE message:', error);
    // }
  }

  /**
   * 重置事件监听器（主要用于测试）
   */
  static reset(): void {
    if (!this.isInitialized) {
      return;
    }

    customEventBus.off('task.instances.generated');
    customEventBus.off('task.template.created');
    customEventBus.off('task.instance.completed');

    this.isInitialized = false;
    console.log('🔄 [TaskEventHandler] Event listeners reset');
  }
}
