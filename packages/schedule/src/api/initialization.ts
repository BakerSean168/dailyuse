/**
 * Schedule Module Initialization Tasks
 *
 * Registers event handlers and background tasks to InitializationManager.
 */

import {
  InitializationManager,
  InitializationPhase,
  type InitializationTask,
  createLogger,
} from '@dailyuse/utils';

const logger = createLogger('ScheduleInit');

const scheduleEventHandlersInitTask: InitializationTask = {
  name: 'schedule:event-handlers',
  phase: InitializationPhase.APP_STARTUP,
  priority: 20,
  initialize: async () => {
    logger.info('[Schedule] Event handlers initialized');
  },
  cleanup: async () => {
    logger.info('[Schedule] Cleaning up event handlers...');
    logger.info('[Schedule] Event handlers cleaned up');
  },
};

export function registerScheduleInitializationTasks(): void {
  const manager = InitializationManager.getInstance();
  manager.registerTask(scheduleEventHandlersInitTask);
  logger.info('[Schedule] Initialization tasks registered');
}
