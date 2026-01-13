/**
 * Notification Module - Main Entry
 *
 * 通知模块入口
 * - 注册 InitializationManager 任务
 * - 统一管理 Notification 模块的初始化和清理
 * 
 * 注意: IPC handlers 已在 ipc-registry.ts 中通过 NotificationIPCHandler 类自动注册
 *       不需要在此处重复注册
 */

import { InitializationManager, InitializationPhase } from '@dailyuse/utils';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('NotificationModule');

/**
 * 注册 Notification 模块到 InitializationManager
 */
export function registerNotificationModule(): void {
  const manager = InitializationManager.getInstance();

  manager.registerTask({
    name: 'notification-module',
    phase: InitializationPhase.APP_STARTUP,
    priority: 45, // Notification 模块优先级（作为核心服务，在 Goal 之前）
    initialize: async () => {
      logger.info('Initializing Notification module...');

      // IPC handlers 已在 ipc-registry.ts 中自动注册
      // 此处仅用于其他初始化逻辑（如事件监听器等）

      logger.info('Notification module initialized');
    },
    cleanup: async () => {
      logger.info('Cleaning up Notification module...');

      // IPC handlers 的清理由 ipc-registry 统一管理
      // 此处仅用于其他清理逻辑

      logger.info('Notification module cleanup complete');
    },
  });

  logger.info('Notification module registered');
}

// Re-export sub-modules
export * from './application/NotificationDesktopApplicationService';
export * from './ipc/notification.ipc-handlers';
