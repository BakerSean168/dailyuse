/**
 * Schedule Module Initialization
 *
 * Registers Schedule module initialization tasks:
 * - IPC handler setup
 * - Schedule service initialization
 * - DesktopScheduler (优先队列调度器) 初始化
 */

import { InitializationManager, InitializationPhase } from '@dailyuse/utils';
import { ScheduleContainer, type ScheduledItem } from '@dailyuse/schedule/application-server';
import type { ScheduleTask } from '@dailyuse/schedule/domain-server';
import { DesktopScheduler } from '../infrastructure';
import { executeScheduleTask } from '../application/services';

/**
 * 任务加载器 - 从数据库加载活跃任务
 */
async function loadActiveTasks(): Promise<ScheduledItem[]> {
  try {
    const container = ScheduleContainer.getInstance();
    const repository = container.getScheduleTaskRepository();
    // 使用 findEnabled 获取所有启用的任务
    const tasks = await repository.findEnabled();

    return tasks
      .filter((task: ScheduleTask) => task.enabled && task.nextRunAt)
      .map((task: ScheduleTask) => ({
        taskUuid: task.uuid,
        taskName: task.taskName,
        nextRunAt: task.nextRunAt!.getTime(),
        cronExpression: task.schedule?.cronExpression ?? null,
        timezone: task.schedule?.timezone,
      }));
  } catch (error) {
    console.error('[Schedule Module] Failed to load active tasks:', error);
    return [];
  }
}

export function registerScheduleInitializationTasks(): void {
  const manager = InitializationManager.getInstance();

  // 模块基础初始化
  manager.registerTask({
    name: 'schedule-module-initialization',
    phase: InitializationPhase.APP_STARTUP,
    priority: 50,
    dependencies: ['di-container-configuration'],
    initialize: async () => {
      console.log('[Schedule Module] Initializing Schedule module...');
      try {
        // Schedule IPC handlers are registered as part of the general IPC initialization
        // in ipc-registry.ts, but module-specific initialization can go here
        console.log('[Schedule Module] Schedule module initialized');
      } catch (error) {
        console.error('[Schedule Module] Schedule module initialization failed:', error);
        throw error;
      }
    },
    cleanup: async () => {
      console.log('[Schedule Module] Cleaning up Schedule module...');
    },
  });

  // 调度器初始化
  manager.registerTask({
    name: 'schedule-task-queue',
    phase: InitializationPhase.APP_STARTUP,
    priority: 55, // 在模块初始化之后
    dependencies: ['schedule-module-initialization'],
    initialize: async () => {
      console.log('[Schedule Module] Starting task queue...');
      try {
        // 创建调度器实例
        const scheduler = DesktopScheduler.createInstance({
          taskLoader: {
            loadActiveTasks,
          },
          onExecuteTask: executeScheduleTask,
          onExecuteError: (taskUuid, error) => {
            console.error(
              `[Schedule Module] Task execution error: ${taskUuid}`,
              error
            );
          },
        });

        // 启动调度器
        await scheduler.start();

        console.log('[Schedule Module] Task queue started');
      } catch (error) {
        console.error('[Schedule Module] Task queue initialization failed:', error);
        throw error;
      }
    },
    cleanup: async () => {
      console.log('[Schedule Module] Stopping task queue...');
      try {
        if (DesktopScheduler.hasInstance()) {
          DesktopScheduler.destroyInstance();
        }
        console.log('[Schedule Module] Task queue stopped');
      } catch (error) {
        console.error('[Schedule Module] Task queue cleanup failed:', error);
      }
    },
  });
}
