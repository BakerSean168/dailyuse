/**
 * Task Module Initialization Tasks (Legacy).
 * 任务模块初始化任务（遗留）。
 *
 * Registers event handlers and background tasks to InitializationManager.
 * 将事件处理器和后台任务注册到 InitializationManager。
 *
 * @deprecated Replaced by {@link createTaskRuntimeContribution} in `./runtime.ts`.
 *             The new pattern uses instance-owned start/stop lifecycle instead of
 *             global InitializationManager registration.
 * @deprecated 已被 `./runtime.ts` 中的 {@link createTaskRuntimeContribution} 取代。
 *             新模式使用实例级的 start/stop 生命周期，而非全局 InitializationManager 注册。
 *
 * @see {@link createTaskRuntimeContribution} for the replacement.
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

/**
 * @deprecated Use `createTaskRuntimeContribution()` from `./runtime.ts` instead.
 * @deprecated 请使用 `./runtime.ts` 中的 `createTaskRuntimeContribution()`。
 */
export function registerTaskInitializationTasks(): void {
  const manager = InitializationManager.getInstance();
  manager.registerTask(taskEventHandlersInitTask);
  manager.registerTask(taskJobsInitTask);
  console.log('Task module initialization tasks registered');
}
