/**
 * IPC Registry
 * 
 * Centralized registry for all module-specific IPC handlers.
 * Ensures that all handlers are instantiated and registered when the application starts.
 * 
 * Functions:
 * - Initializes all IPC handlers in a unified way.
 * - Provides centralized access to handler instances.
 * - Logs the registration status of handlers.
 *
 * @module modules/ipc-registry
 */

import { createLogger } from '@dailyuse/utils';

// Import all IPC handlers
import { aiIPCHandler } from './ai/ipc/ai-ipc-handler';
import { taskIPCHandler } from './task/ipc/task-ipc-handler';
import { taskTemplateIPCHandler } from './task/ipc/task-template.ipc-handlers';
import { taskInstanceIPCHandler } from './task/ipc/task-instance.ipc-handlers';
import { taskDependencyIPCHandler } from './task/ipc/task-dependency.ipc-handlers';
import { taskStatisticsIPCHandler } from './task/ipc/task-statistics.ipc-handlers';
import { goalIPCHandler } from './goal/ipc/goal-ipc-handler';
import { goalFolderIPCHandler } from './goal/ipc/goal-folder.ipc-handlers';
import { scheduleIPCHandler } from './schedule/ipc/schedule-ipc-handler';
import { ScheduleTaskIPCHandler } from './schedule/ipc/schedule-task.ipc-handlers';
import { ScheduleStatisticsIPCHandler } from './schedule/ipc/schedule-statistics.ipc-handlers';
import { NotificationIPCHandler } from './notification/ipc/notification.ipc-handlers';
import { RepositoryIPCHandler } from './repository/ipc/repository.ipc-handlers';
import { DashboardIPCHandler } from './dashboard/ipc/dashboard.ipc-handlers';
import { ReminderTemplateIPCHandler } from './reminder/ipc/reminder-template.ipc-handlers';
import { ReminderGroupIPCHandler } from './reminder/ipc/reminder-group.ipc-handlers';
import { ReminderStatisticsIPCHandler } from './reminder/ipc/reminder-statistics.ipc-handlers';
import { accountIPCHandler } from './account/ipc/account-ipc-handler';
import { authIPCHandler } from './authentication/ipc/auth-ipc-handler';
import { SettingIPCHandler } from './setting/ipc/setting.ipc-handlers';
import { getSyncIPCHandlerV2 } from './sync';

const logger = createLogger('IPCRegistry');

/**
 * Collection of all initialized IPC handler instances.
 * Keyed by module/feature name.
 */
export const ipcHandlers = {
  ai: aiIPCHandler,
  task: taskIPCHandler,
  taskTemplate: taskTemplateIPCHandler,
  taskInstance: taskInstanceIPCHandler,
  taskDependency: taskDependencyIPCHandler,
  taskStatistics: taskStatisticsIPCHandler,
  goal: goalIPCHandler,
  goalFolder: goalFolderIPCHandler,
  schedule: scheduleIPCHandler,
  scheduleTask: new ScheduleTaskIPCHandler(),
  scheduleStatistics: new ScheduleStatisticsIPCHandler(),
  notification: new NotificationIPCHandler(),
  repository: new RepositoryIPCHandler(),
  dashboard: new DashboardIPCHandler(),
  reminderTemplate: new ReminderTemplateIPCHandler(),
  reminderGroup: new ReminderGroupIPCHandler(),
  reminderStatistics: new ReminderStatisticsIPCHandler(),
  account: accountIPCHandler,
  auth: authIPCHandler,
  setting: new SettingIPCHandler(),
  sync: getSyncIPCHandlerV2(),
};

/**
 * Initializes all IPC handlers.
 * 
 * This function should be called early in the Electron main process startup sequence.
 * It ensures that all handler classes are instantiated (and thus their IPC listeners registered).
 */
export function initializeIPCHandlers(): void {
  const startTime = performance.now();
  
  logger.info('Initializing IPC handlers...');
  
  // Handlers are typically registered in their constructors or via singleton initialization.
  // Accessing ipcHandlers ensures all imports are resolved and instances created.
  const handlerCount = Object.keys(ipcHandlers).length;
  
  const duration = performance.now() - startTime;
  logger.info(`IPC handlers initialized`, {
    count: handlerCount,
    duration: `${duration.toFixed(2)}ms`,
    modules: Object.keys(ipcHandlers),
  });
}

/**
 * Retrieves statistics about registered IPC handlers.
 *
 * @returns {Object} Stats containing total handler count and list of modules.
 */
export function getIPCHandlerStats(): {
  totalHandlers: number;
  modules: string[];
} {
  return {
    totalHandlers: Object.keys(ipcHandlers).length,
    modules: Object.keys(ipcHandlers),
  };
}

export {
  aiIPCHandler,
  taskIPCHandler,
  taskTemplateIPCHandler,
  taskInstanceIPCHandler,
  taskDependencyIPCHandler,
  taskStatisticsIPCHandler,
  goalIPCHandler,
  goalFolderIPCHandler,
  scheduleIPCHandler,
  ScheduleTaskIPCHandler,
  ScheduleStatisticsIPCHandler,
  NotificationIPCHandler,
  RepositoryIPCHandler,
  DashboardIPCHandler,
  ReminderTemplateIPCHandler,
  ReminderGroupIPCHandler,
  ReminderStatisticsIPCHandler,
  accountIPCHandler,
  authIPCHandler,
  SettingIPCHandler,
  getSyncIPCHandlerV2,
};
