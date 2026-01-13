/**
 * Reminder Module - Main Entry
 *
 * 提醒模块入口
 * - 注册 InitializationManager 任务
 * - 统一管理 Reminder 模块的初始化和清理
 * 
 * 注意: IPC handlers 已在 ipc-registry.ts 中自动注册
 */

import { InitializationManager, InitializationPhase } from '@dailyuse/utils';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('ReminderModule');

/**
 * 注册 Reminder 模块到 InitializationManager
 */
export function registerReminderModule(): void {
  const manager = InitializationManager.getInstance();

  manager.registerTask({
    name: 'reminder-module',
    phase: InitializationPhase.APP_STARTUP,
    priority: 80, // Reminder 模块优先级（在 Schedule 模块之后）
    initialize: async () => {
      logger.info('Initializing Reminder module...');

      // IPC handlers 已在 ipc-registry.ts 中自动注册

      logger.info('Reminder module initialized');
    },
    cleanup: async () => {
      logger.info('Cleaning up Reminder module...');

      // IPC handlers 的清理由 ipc-registry 统一管理

      logger.info('Reminder module cleanup complete');
    },
  });

  logger.info('Reminder module registered');
}

// Re-export sub-modules
export * from './application/ReminderDesktopApplicationService';
export * from './ipc/reminder-template.ipc-handlers';
export * from './ipc/reminder-group.ipc-handlers';
export * from './ipc/reminder-statistics.ipc-handlers';
