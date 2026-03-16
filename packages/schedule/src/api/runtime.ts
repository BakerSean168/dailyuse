/**
 * Schedule runtime contributions for server transports.
 * 调度模块服务端传输层的运行时贡献。
 *
 * This file keeps side effects explicit and reversible.
 * Instead of globally registering initialization tasks via InitializationManager,
 * the schedule module now owns its event subscriptions through a small runtime object.
 *
 * 这个文件让副作用显式且可逆。
 * schedule 不再通过 InitializationManager 全局注册初始化任务，
 * 而是通过一个轻量的 runtime 对象管理自身事件订阅生命周期。
 *
 * The ScheduleEventPublisher static configuration is wrapped here so the
 * composition root can start/stop it together with the module instance.
 */

import { createLogger } from '@dailyuse/utils';
import { ScheduleEventPublisher } from '../application-server/use-cases/schedule-event-publisher';
import type { ScheduleModuleRuntimeContribution } from '../infrastructure-server';
import type {
  CreateScheduleTaskUseCase,
  DeleteScheduleTaskUseCase,
  ListScheduleTasksBySourceUseCase,
  PauseScheduleTaskUseCase,
  ResumeScheduleTaskUseCase,
} from '../application-server/use-cases';

const logger = createLogger('ScheduleRuntime');

/**
 * Runtime contribution contract used by module transports.
 * 模块传输层使用的运行时贡献契约。
 */
export type ScheduleRuntimeContribution = ScheduleModuleRuntimeContribution;

/**
 * The use cases needed by the ScheduleEventPublisher.
 * ScheduleEventPublisher 所需的 use case 子集。
 */
export interface ScheduleEventPublisherDependencies {
  readonly createScheduleTask: CreateScheduleTaskUseCase;
  readonly listScheduleTasksBySource: ListScheduleTasksBySourceUseCase;
  readonly deleteScheduleTask: DeleteScheduleTaskUseCase;
  readonly pauseScheduleTask: PauseScheduleTaskUseCase;
  readonly resumeScheduleTask: ResumeScheduleTaskUseCase;
}

/**
 * Creates an instance-owned runtime contribution that manages the
 * ScheduleEventPublisher lifecycle.
 * 创建实例级 runtime 贡献对象，管理 ScheduleEventPublisher 的生命周期。
 *
 * The ScheduleEventPublisher listens to cross-module domain events
 * (goal:create, task:create, reminder:template:created, etc.) and
 * creates/deletes/pauses/resumes schedule tasks accordingly.
 *
 * ScheduleEventPublisher 监听跨模块领域事件
 * （goal:create, task:create, reminder:template:created 等），
 * 并据此创建/删除/暂停/恢复调度任务。
 *
 * @param deps - Use case dependencies that the publisher needs to operate.
 *               发布器运行所需的 use case 依赖。
 */
export function createScheduleRuntimeContribution(
  deps: ScheduleEventPublisherDependencies,
): ScheduleRuntimeContribution {
  let started = false;

  return {
    start(): void {
      if (started) {
        return;
      }

      // Wire up the static publisher with use case references.
      // 将静态发布器与 use case 引用接好线。
      ScheduleEventPublisher.configure({
        createScheduleTask: deps.createScheduleTask,
        listScheduleTasksBySource: deps.listScheduleTasksBySource,
        deleteScheduleTask: deps.deleteScheduleTask,
        pauseScheduleTask: deps.pauseScheduleTask,
        resumeScheduleTask: deps.resumeScheduleTask,
      });

      // Start listening to domain events.
      // 开始监听领域事件。
      ScheduleEventPublisher.initialize();

      started = true;
      logger.info('[Schedule] Runtime contribution started');
    },

    stop(): void {
      if (!started) {
        return;
      }

      // Unsubscribe all event listeners.
      // 取消订阅所有事件监听器。
      ScheduleEventPublisher.reset();

      started = false;
      logger.info('[Schedule] Runtime contribution stopped');
    },
  };
}
