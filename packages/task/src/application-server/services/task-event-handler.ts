import { eventBus, type DomainEvent, Logger } from '@dailyuse/utils';

const logger = new Logger('TaskEventHandler');

/**
 * Task 妯″潡浜嬩欢澶勭悊鍣?
 * 璐熻矗锛?
 * 1. 鐩戝惉 Task 妯″潡鐨勯鍩熶簨浠?
 * 2. 閫氳繃 SSE 鎺ㄩ€佺粰鍓嶇
 * 3. 瀹炵幇浠诲姟瀹炰緥鐨勫疄鏃跺悓姝?
 */
export class TaskEventHandler {
  private static isInitialized = false;

  /**
   * 鍒濆鍖栦簨浠剁洃鍚櫒锛堝湪搴旂敤鍚姩鏃惰皟鐢ㄤ竴娆★級
   */
  static async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('鈿狅笍 [TaskEventHandler] Already initialized, skipping');
      return;
    }

    console.log('馃帶 [TaskEventHandler] Initializing event listeners...');

    /**
     * 鐩戝惉 Task 瀹炰緥鐢熸垚浜嬩欢
     */
    eventBus.on('task.instances.generated', async (event: DomainEvent) => {
      try {
        await this.handleTaskInstancesGenerated(event);
      } catch (error) {
        logger.error('[TaskEventHandler] Error handling task.instances.generated:', error);
      }
    });

    /**
     * 鐩戝惉 Task 妯℃澘鍒涘缓浜嬩欢
     */
    eventBus.on('task.template.created', async (event: DomainEvent) => {
      try {
        await this.handleTaskTemplateCreated(event);
      } catch (error) {
        logger.error('[TaskEventHandler] Error handling task.template.created:', error);
      }
    });

    /**
     * 鐩戝惉 Task 瀹炰緥瀹屾垚浜嬩欢
     */
    eventBus.on('task.instance.completed', async (event: DomainEvent) => {
      try {
        await this.handleTaskInstanceCompleted(event);
      } catch (error) {
        logger.error('[TaskEventHandler] Error handling task.instance.completed:', error);
      }
    });

    this.isInitialized = true;
    console.log('鉁?[TaskEventHandler] Event listeners initialized');
  }

  /**
   * 澶勭悊浠诲姟瀹炰緥鐢熸垚浜嬩欢
   */
  private static async handleTaskInstancesGenerated(event: DomainEvent): Promise<void> {
    const { identityId, payload } = event;
    
    if (!identityId) {
      logger.error('[TaskEventHandler] Missing identityId in task.instances.generated event');
      return;
    }

    const { templateId, templateTitle, instanceCount, instances, dateRange, strategy } = payload as any;

    logger.info('馃摝 [TaskEventHandler] Task instances generated', {
      identityId,
      templateId,
      templateTitle,
      instanceCount,
      strategy,
    });

    // 閫氳繃 SSE 鎺ㄩ€佺粰鍓嶇
    try {
      const { SSEConnectionManager } = await import('../../../notification/interface/sseRoutes');
      const sseManager = SSEConnectionManager.getInstance();
      
      // 鏍规嵁绛栫暐鏋勫缓鎺ㄩ€佹暟鎹?
      const pushData: any = {
        templateId,
        templateTitle,
        instanceCount,
        dateRange,
        strategy, // 'full' 鎴?'summary'
        timestamp: new Date().toISOString(),
      };

      // 濡傛灉鏄畬鏁存暟鎹瓥鐣ワ紝鍖呭惈瀹炰緥鏁版嵁
      if (strategy === 'full' && instances) {
        pushData.instances = instances;
      }

      const sent = sseManager.sendMessage(identityId, 'task:instances-generated', pushData);

      if (sent) {
        logger.info('馃摛 [SSE鎺ㄩ€乚 task:instances-generated 浜嬩欢宸插彂閫?, {
          identityId,
          templateId,
          instanceCount,
          strategy,
          dataSize: strategy === 'full' ? 'full' : 'summary-only',
        });
      } else {
        logger.warn('鈿狅笍 [SSE鎺ㄩ€乚 task:instances-generated 浜嬩欢鍙戦€佸け璐ワ紙鐢ㄦ埛鍙兘鏈繛鎺ワ級', {
          identityId,
          templateId,
        });
      }
    } catch (error) {
      logger.error('[TaskEventHandler] Failed to send SSE message:', error);
    }
  }

  /**
   * 澶勭悊浠诲姟妯℃澘鍒涘缓浜嬩欢
   */
  private static async handleTaskTemplateCreated(event: DomainEvent): Promise<void> {
    const { identityId, payload } = event as any;
    
    if (!identityId) {
      return;
    }

    logger.info('馃摑 [TaskEventHandler] Task template created', {
      identityId,
      templateId: payload.templateId,
    });

    // 鎺ㄩ€佺粰鍓嶇
    try {
      const { SSEConnectionManager } = await import('../../../notification/interface/sseRoutes');
      const sseManager = SSEConnectionManager.getInstance();
      
      sseManager.sendMessage(identityId, 'task:template-created', {
        template: payload.template,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('[TaskEventHandler] Failed to send SSE message:', error);
    }
  }

  /**
   * 澶勭悊浠诲姟瀹炰緥瀹屾垚浜嬩欢
   */
  private static async handleTaskInstanceCompleted(event: DomainEvent): Promise<void> {
    const { identityId, payload } = event as any;
    
    if (!identityId) {
      return;
    }

    logger.info('鉁?[TaskEventHandler] Task instance completed', {
      identityId,
      instanceId: payload.instanceId,
    });

    // 鎺ㄩ€佺粰鍓嶇
    try {
      const { SSEConnectionManager } = await import('../../../notification/interface/sseRoutes');
      const sseManager = SSEConnectionManager.getInstance();
      
      sseManager.sendMessage(identityId, 'task:instance-completed', {
        instance: payload.instance,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('[TaskEventHandler] Failed to send SSE message:', error);
    }
  }

  /**
   * 閲嶇疆浜嬩欢鐩戝惉鍣紙涓昏鐢ㄤ簬娴嬭瘯锛?
   */
  static reset(): void {
    if (!this.isInitialized) {
      return;
    }

    eventBus.off('task.instances.generated');
    eventBus.off('task.template.created');
    eventBus.off('task.instance.completed');

    this.isInitialized = false;
    console.log('馃攧 [TaskEventHandler] Event listeners reset');
  }
}
