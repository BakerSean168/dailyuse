/**
 * Repository Module - Desktop Main Process
 *
 * 仓库模块 - 注册 IPC handlers 和生命周期管理
 *
 * 功能：
 * - 同步 (Sync)：离线模式下占位
 * - 备份 (Backup)：本地数据备份/恢复
 * - 导入/导出 (Import/Export)：数据迁移
 *
 * 注意: IPC handlers 已在 ipc-registry.ts 中自动注册
 *
 * @module repository
 */

import { InitializationManager, InitializationPhase, createLogger } from '@dailyuse/utils';

const logger = createLogger('RepositoryModule');

/**
 * 注册 Repository 模块到初始化管理器
 *
 * Priority: 140 (after Account module)
 * Dependencies: infrastructure (10), database (20)
 */
export function registerRepositoryModule(): void {
  logger.info('Registering Repository module...');

  InitializationManager.getInstance().registerTask({
    name: 'repository-module',
    phase: InitializationPhase.APP_STARTUP,
    priority: 140, // After Account module (130)

    async initialize() {
      logger.info('Initializing Repository module...');

      try {
        // IPC handlers 已在 ipc-registry.ts 中自动注册

        logger.info('Repository module initialized successfully');
      } catch (error) {
        logger.error('Failed to initialize Repository module', error);
        throw error;
      }
    },

    async cleanup() {
      logger.info('Cleaning up Repository module...');

      try {
        // IPC handlers 的清理由 ipc-registry 统一管理

        logger.info('Repository module cleaned up successfully');
      } catch (error) {
        logger.error('Failed to cleanup Repository module', error);
      }
    },
  });

  logger.info('Repository module registered');
}

// Re-export application services
export { RepositoryDesktopApplicationService } from './application/RepositoryDesktopApplicationService';

// Re-export IPC handlers for direct use if needed
export {
  registerRepositoryIpcHandlers,
  unregisterRepositoryIpcHandlers,
} from './ipc/repository.ipc-handlers';
