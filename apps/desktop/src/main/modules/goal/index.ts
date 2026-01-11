/**
 * Goal Module Registration
 *
 * Registers Goal module with InitializationManager
 * Implements: STORY-002 Goal Module
 */

import { InitializationManager, InitializationPhase, createLogger } from '@dailyuse/utils';
import { goalIPCHandler } from './ipc/goal-ipc-handler';
import { goalFolderIPCHandler } from './ipc/goal-folder.ipc-handlers';

const logger = createLogger('GoalModule');

export function registerGoalModule(): void {
  const manager = InitializationManager.getInstance();

  manager.registerTask({
    name: 'goal',
    phase: InitializationPhase.APP_STARTUP,
    priority: 50, // After infrastructure (priority 10)
    initialize: async () => {
      logger.info('[Goal] Initializing Goal module...');

      // IPC handlers are automatically registered in their constructors
      // We just need to ensure the instances are created (which happens at import)
      logger.info('[Goal] IPC handlers registered:', {
        goalHandler: !!goalIPCHandler,
        goalFolderHandler: !!goalFolderIPCHandler,
      });

      logger.info('[Goal] Goal module initialized successfully');
    },
  });

  logger.info('[Goal] Goal module registered');
}
