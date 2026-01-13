/**
 * Dashboard Module - Main Entry
 *
 * Dashboard 模块入口
 * - 注册 InitializationManager 任务
 * - 统一管理 Dashboard 模块的初始化和清理
 */

import { InitializationManager, InitializationPhase } from '@dailyuse/utils';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('DashboardModule');

/**
 * 注册 Dashboard 模块到 InitializationManager
 * 
 * 注意：IPC handlers 的注册由 ipc-registry.ts 统一管理，
 * 此模块仅负责初始化阶段的日志记录
 */
export function registerDashboardModule(): void {
  const manager = InitializationManager.getInstance();

  manager.registerTask({
    name: 'dashboard-module',
    phase: InitializationPhase.APP_STARTUP,
    priority: 110, // Dashboard 模块优先级（在其他功能模块之后，需要聚合数据）
    initialize: async () => {
      logger.info('Initializing Dashboard module...');
      // IPC handlers 由 ipc-registry.ts 统一注册
      logger.info('Dashboard module initialized (10 IPC channels)');
    },
    cleanup: async () => {
      logger.info('Cleaning up Dashboard module...');
      // IPC handlers 的清理由 ipc-registry 统一管理
      logger.info('Dashboard module cleanup complete');
    },
  });

  logger.info('Dashboard module registered');
}

// Re-export sub-modules
export * from './application/DashboardDesktopApplicationService';
export * from './ipc/dashboard.ipc-handlers';
