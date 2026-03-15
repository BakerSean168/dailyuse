/**
 * Schedule Module Initialization Tasks
 * 调度模块初始化任务
 *
 * @deprecated This file is superseded by `./runtime.ts` which provides
 *             explicit, instance-owned lifecycle management instead of
 *             global InitializationManager hooks.
 * @deprecated 此文件已被 `./runtime.ts` 取代，后者提供显式的实例级
 *             生命周期管理，而非全局 InitializationManager 钩子。
 *
 * @see {@link createScheduleRuntimeContribution} from './runtime'
 */

import {
  InitializationManager,
  InitializationPhase,
  type InitializationTask,
  createLogger,
} from '@dailyuse/utils';
import { ScheduleEventPublisher } from '../application-server/use-cases/schedule-event-publisher';

const logger = createLogger('ScheduleInit');

/**
 * @deprecated Use createScheduleRuntimeContribution() instead.
 * @deprecated 请改用 createScheduleRuntimeContribution()。
 */
const scheduleEventHandlersInitTask: InitializationTask = {
  name: 'schedule:event-handlers',
  phase: InitializationPhase.APP_STARTUP,
  priority: 20,
  initialize: async () => {
    await ScheduleEventPublisher.initialize();
    logger.info('[Schedule] Event handlers initialized');
  },
  cleanup: async () => {
    logger.info('[Schedule] Cleaning up event handlers...');
    logger.info('[Schedule] Event handlers cleaned up');
  },
};

/**
 * @deprecated Use createScheduleRuntimeContribution() from './runtime' instead.
 *             The runtime contribution pattern manages lifecycle explicitly
 *             through the module instance's start()/dispose() methods.
 * @deprecated 请改用 './runtime' 中的 createScheduleRuntimeContribution()。
 *             运行时贡献模式通过模块实例的 start()/dispose() 方法显式管理生命周期。
 */
export function registerScheduleInitializationTasks(): void {
  const manager = InitializationManager.getInstance();
  manager.registerTask(scheduleEventHandlersInitTask);
  logger.info('[Schedule] Initialization tasks registered');
}
