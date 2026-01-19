/**
 * Authentication 模块初始化
 *
 * 职责：
 * - 注册事件处理器（监听 account:created 事件）
 * - 初始化 Authentication 模块的基础设施
 */

import {
  InitializationManager,
  InitializationPhase,
  type InitializationTask,
  eventBus,
  createLogger,
} from '@dailyuse/utils';
import { AccountCreatedHandler } from '../application/event-handlers/AccountCreatedHandler';

const logger = createLogger('AuthenticationInit');

/**
 * 注册事件处理器初始化任务
 */
const registerEventHandlersTask: InitializationTask = {
  name: 'authentication:event-handlers',
  phase: InitializationPhase.APP_STARTUP,
  priority: 20, // 优先级 20，确保在数据库初始化之后执行
  initialize: async () => {
    logger.info('[Authentication] Registering event handlers...');

    // 获取 AccountCreatedHandler 单例
    const accountCreatedHandler = AccountCreatedHandler.getInstance();

    // 注册 account:created 事件处理器
    eventBus.on('account:created', async (event) => {
      try {
        await accountCreatedHandler.handle(event);
      } catch (error) {
        logger.error('[Authentication] Error handling account:created event', {
          error: error instanceof Error ? error.message : String(error),
          event,
        });
        // ⚠️ 可以选择：
        // 1. 重新抛出错误，让事件总线处理重试
        // 2. 记录错误，通过补偿机制处理（推荐）
        // 这里选择方案 2：不阻塞流程，通过监控和补偿机制处理
      }
    });

    logger.info('[Authentication] Event handlers registered successfully', {
      handlers: ['account:created'],
    });
  },
  cleanup: async () => {
    logger.info('[Authentication] Cleaning up event handlers...');
    // 移除事件监听器
    eventBus.off('account:created');
    logger.info('[Authentication] Event handlers cleaned up');
  },
};

/**
 * 注册 Authentication 模块的所有初始化任务
 */
export function registerAuthenticationInitializationTasks(): void {
  const manager = InitializationManager.getInstance();

  // 注册事件处理器任务
  manager.registerTask(registerEventHandlersTask);

  logger.info('[Authentication] Initialization tasks registered');
}
