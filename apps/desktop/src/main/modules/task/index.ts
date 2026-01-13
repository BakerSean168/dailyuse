/**
 * Task Module Registration
 *
 * Registers Task module with InitializationManager
 * Implements: STORY-003 Task Module
 * 
 * 注意: IPC handlers 已在 ipc-registry.ts 中自动注册
 */

import { InitializationManager, InitializationPhase, createLogger } from '@dailyuse/utils';

const logger = createLogger('TaskModule');

export function registerTaskModule(): void {
  const manager = InitializationManager.getInstance();

  manager.registerTask({
    name: 'task',
    phase: InitializationPhase.APP_STARTUP,
    priority: 60, // After goal module (priority 50)
    initialize: async () => {
      logger.info('[Task] Initializing Task module...');

      // IPC handlers 已在 ipc-registry.ts 中自动注册

      logger.info('[Task] Task module initialized successfully');
    },
  });

  logger.info('[Task] Task module registered');
}
