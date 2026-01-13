/**
 * AI Module - Main Entry
 *
 * AI 模块入口
 * - 注册 InitializationManager 任务
 * - 统一管理 AI 模块的初始化和清理
 */

import { InitializationManager, InitializationPhase } from '@dailyuse/utils';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('AIModule');

/**
 * 注册 AI 模块到 InitializationManager
 * 
 * 注意：IPC handlers 的注册由 ipc-registry.ts 统一管理，
 * 此模块仅负责初始化阶段的日志记录
 */
export function registerAIModule(): void {
  const manager = InitializationManager.getInstance();

  manager.registerTask({
    name: 'ai-module',
    phase: InitializationPhase.APP_STARTUP,
    priority: 120, // AI 模块优先级（在 Dashboard 之后）
    initialize: async () => {
      logger.info('Initializing AI module...');
      // IPC handlers 由 ipc-registry.ts 统一注册
      logger.info('AI module initialized (27 IPC channels)');
    },
    cleanup: async () => {
      logger.info('Cleaning up AI module...');
      // IPC handlers 的清理由 ipc-registry 统一管理
      logger.info('AI module cleanup complete');
    },
  });

  logger.info('AI module registered');
}

// Re-export sub-modules
export * from './application/AIDesktopApplicationService';
export * from './ipc/ai.ipc-handlers';
