/**
 * Schedule Module - Main Entry
 *
 * 调度模块入口
 * - 注册 InitializationManager 任务
 * - 统一管理 Schedule 模块的初始化和清理
 * 
 * 注意: IPC handlers 已在 ipc-registry.ts 中通过 ScheduleTaskIPCHandler/ScheduleStatisticsIPCHandler 类自动注册
 *       不需要在此处重复注册
 */

import { InitializationManager, InitializationPhase } from '@dailyuse/utils';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('ScheduleModule');

/**
 * 注册 Schedule 模块到 InitializationManager
 */
export function registerScheduleModule(): void {
  const manager = InitializationManager.getInstance();

  manager.registerTask({
    name: 'schedule-module',
    phase: InitializationPhase.APP_STARTUP,
    priority: 70, // Schedule 模块优先级（在 Task 模块之后）
    initialize: async () => {
      logger.info('Initializing Schedule module...');

      // IPC handlers 已在 ipc-registry.ts 中自动注册
      // 此处仅用于其他初始化逻辑（如事件监听器、定时任务等）

      logger.info('Schedule module initialized');
    },
    cleanup: async () => {
      logger.info('Cleaning up Schedule module...');

      // IPC handlers 的清理由 ipc-registry 统一管理
      // 此处仅用于其他清理逻辑

      logger.info('Schedule module cleanup complete');
    },
  });

  logger.info('Schedule module registered');
}

// Re-export sub-modules
export * from './application/ScheduleDesktopApplicationService';
export * from './ipc/schedule-task.ipc-handlers';
