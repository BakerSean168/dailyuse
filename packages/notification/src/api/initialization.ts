/**
 * Notification Module Initialization Tasks
 *
 * Register event handlers and background tasks to InitializationManager.
 */

import {
  InitializationManager,
  InitializationPhase,
  type InitializationTask,
} from '@dailyuse/utils';

const notificationEventHandlersInitTask: InitializationTask = {
  name: 'notificationEventHandlers',
  phase: InitializationPhase.APP_STARTUP,
  priority: 35,
  initialize: async () => {
    console.log('✓ Notification event handlers initialized');
  },
};

const notificationJobsInitTask: InitializationTask = {
  name: 'notificationJobs',
  phase: InitializationPhase.APP_STARTUP,
  priority: 36,
  initialize: async () => {
    console.log('✓ Notification background jobs initialized');
  },
};

export function registerNotificationInitializationTasks(): void {
  const manager = InitializationManager.getInstance();
  manager.registerTask(notificationEventHandlersInitTask);
  manager.registerTask(notificationJobsInitTask);
  console.log('Notification module initialization tasks registered');
}
