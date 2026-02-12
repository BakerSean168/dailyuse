/**
 * Task Module Initialization Tasks
 *
 * Registers event handlers and background tasks to InitializationManager.
 */

import {
  InitializationManager,
  InitializationPhase,
  type InitializationTask,
} from '@dailyuse/utils';
import { TaskEventHandler } from '../application-server/handlers/task-event.handler';

const taskEventHandlersInitTask: InitializationTask = {
  name: 'taskEventHandlers',
  phase: InitializationPhase.APP_STARTUP,
  priority: 30,
  initialize: async () => {
    await TaskEventHandler.initialize();
    console.log('✓ Task event handlers initialized');
  },
};

const taskJobsInitTask: InitializationTask = {
  name: 'taskJobs',
  phase: InitializationPhase.APP_STARTUP,
  priority: 31,
  initialize: async () => {
    // TODO: Register background jobs:
    // - taskInstanceGeneratorJob: Generate task instances from templates based on schedule
    // - taskReminderSchedulerJob: Schedule reminders for upcoming task instances
    // - taskExpirationCheckerJob: Mark expired instances as missed
    console.log('✓ Task background jobs initialized');
  },
};

export function registerTaskInitializationTasks(): void {
  const manager = InitializationManager.getInstance();
  manager.registerTask(taskEventHandlersInitTask);
  manager.registerTask(taskJobsInitTask);
  console.log('Task module initialization tasks registered');
}
