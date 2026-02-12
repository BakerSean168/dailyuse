/**
 * Authentication Module Initialization Tasks
 *
 * Registers event handlers and background tasks to InitializationManager.
 */

import {
  InitializationManager,
  InitializationPhase,
  type InitializationTask,
  eventBus,
  createLogger,
} from '@dailyuse/utils';

const logger = createLogger('AuthenticationInit');

const authenticationEventHandlersInitTask: InitializationTask = {
  name: 'authentication:event-handlers',
  phase: InitializationPhase.APP_STARTUP,
  priority: 20,
  initialize: async () => {
    logger.info('[Authentication] Event handlers initialized');
  },
  cleanup: async () => {
    logger.info('[Authentication] Cleaning up event handlers...');
    // Cleanup logic here if needed
    logger.info('[Authentication] Event handlers cleaned up');
  },
};

export function registerAuthenticationInitializationTasks(): void {
  const manager = InitializationManager.getInstance();
  manager.registerTask(authenticationEventHandlersInitTask);
  logger.info('[Authentication] Initialization tasks registered');
}
