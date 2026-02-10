import { eventBus, type DomainEvent, Logger } from '@dailyuse/utils';

const logger = new Logger('TaskEventHandler');

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
    eventBus.on('task.instances.generated', async (event: DomainEvent) => {
      try {
        await this.handleTaskInstancesGenerated(event);
      } catch (error) {
        logger.error('[TaskEventHandler] Error handling task.instances.generated:', error);
      }
    });

    /**
     * 监听 Task 模板创建事件
     */
    eventBus.on('task.template.created', async (event: DomainEvent) => {
      try {
        await this.handleTaskTemplateCreated(event);
      } catch (error) {
        logger.error('[TaskEventHandler] Error handling task.template.created:', error);
      }
    });

    /**
     * 监听 Task 实例完成事件
     */
    eventBus.on('task.instance.completed', async (event: DomainEvent) => {
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
  private static async handleTaskInstancesGenerated(event: DomainEvent): Promise<void> {
    const { accountUuid, payload } = event;
    
    if (!accountUuid) {
      logger.error('[TaskEventHandler] Missing accountUuid in task.instances.generated event');
      return;
    }

    const { templateUuid, templateTitle, instanceCount, instances, dateRange, strategy } = payload as any;

    logger.info('📦 [TaskEventHandler] Task instances generated', {
      accountUuid,
      templateUuid,
      templateTitle,
      instanceCount,
      strategy,
    });

    // 通过 SSE 推送给前端
    try {
      const { SSEConnectionManager } = await import('../../../notification/interface/sseRoutes');
      const sseManager = SSEConnectionManager.getInstance();
      
      // 根据策略构建推送数据
      const pushData: any = {
        templateUuid,
        templateTitle,
        instanceCount,
        dateRange,
        strategy, // 'full' 或 'summary'
        timestamp: new Date().toISOString(),
      };

      // 如果是完整数据策略，包含实例数据
      if (strategy === 'full' && instances) {
        pushData.instances = instances;
      }

      const sent = sseManager.sendMessage(accountUuid, 'task:instances-generated', pushData);

      if (sent) {
        logger.info('📤 [SSE推送] task:instances-generated 事件已发送', {
          accountUuid,
          templateUuid,
          instanceCount,
          strategy,
          dataSize: strategy === 'full' ? 'full' : 'summary-only',
        });
      } else {
        logger.warn('⚠️ [SSE推送] task:instances-generated 事件发送失败（用户可能未连接）', {
          accountUuid,
          templateUuid,
        });
      }
    } catch (error) {
      logger.error('[TaskEventHandler] Failed to send SSE message:', error);
    }
  }

  /**
   * 处理任务模板创建事件
   */
  private static async handleTaskTemplateCreated(event: DomainEvent): Promise<void> {
    const { accountUuid, payload } = event as any;
    
    if (!accountUuid) {
      return;
    }

    logger.info('📝 [TaskEventHandler] Task template created', {
      accountUuid,
      templateUuid: payload.templateUuid,
    });

    // 推送给前端
    try {
      const { SSEConnectionManager } = await import('../../../notification/interface/sseRoutes');
      const sseManager = SSEConnectionManager.getInstance();
      
      sseManager.sendMessage(accountUuid, 'task:template-created', {
        template: payload.template,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('[TaskEventHandler] Failed to send SSE message:', error);
    }
  }

  /**
   * 处理任务实例完成事件
   */
  private static async handleTaskInstanceCompleted(event: DomainEvent): Promise<void> {
    const { accountUuid, payload } = event as any;
    
    if (!accountUuid) {
      return;
    }

    logger.info('✅ [TaskEventHandler] Task instance completed', {
      accountUuid,
      instanceUuid: payload.instanceUuid,
    });

    // 推送给前端
    try {
      const { SSEConnectionManager } = await import('../../../notification/interface/sseRoutes');
      const sseManager = SSEConnectionManager.getInstance();
      
      sseManager.sendMessage(accountUuid, 'task:instance-completed', {
        instance: payload.instance,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('[TaskEventHandler] Failed to send SSE message:', error);
    }
  }

  /**
   * 重置事件监听器（主要用于测试）
   */
  static reset(): void {
    if (!this.isInitialized) {
      return;
    }

    eventBus.off('task.instances.generated');
    eventBus.off('task.template.created');
    eventBus.off('task.instance.completed');

    this.isInitialized = false;
    console.log('🔄 [TaskEventHandler] Event listeners reset');
  }
}
