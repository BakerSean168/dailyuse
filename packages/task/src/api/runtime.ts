/**
 * Task runtime contributions for server transports.
 * 任务模块服务端传输层的运行时贡献。
 *
 * This file keeps side effects explicit and reversible.
 * Instead of globally registering initialization tasks with InitializationManager,
 * the task module now owns its event subscriptions through a small runtime object.
 *
 * 这个文件让副作用显式且可逆。
 * 任务模块不再通过全局 InitializationManager 注册监听器，而是通过一个轻量的
 * runtime 对象管理自身事件订阅生命周期。
 */

import { eventBus } from '@dailyuse/utils/domain';
import { createLogger } from '@dailyuse/utils/logger';
import type { IDomainEvent } from '@dailyuse/contracts/shared';
import type { TaskModuleRuntimeContribution } from '../infrastructure-server/task.module';

const logger = createLogger('TaskRuntime');

/**
 * Loosely-typed event bus handle for registering task event handlers.
 * Task events live in AppEventRegistry but handler signatures are
 * wider than the strict generic constraint allows.
 */
const taskEventBus = eventBus as unknown as {
  on(event: string, handler: (event: unknown) => void): void;
  off(event: string, handler: (event: unknown) => void): void;
};

/**
 * Runtime contribution contract used by module transports.
 * 模块传输层使用的运行时贡献契约。
 */
export type TaskRuntimeContribution = TaskModuleRuntimeContribution;

// Task domain event handlers use a looser bus handle to avoid
// generic-constraint friction with union handler signatures.
const taskEventHandlers: Record<string, (event: IDomainEvent) => void> = {
  'task:instance-generated': (event) => {
    const payload = (event.payload ?? event) as Record<string, unknown>;
    logger.info(`[Task] Instances generated for template: ${payload.templateId}`, {
      templateId: payload.templateId,
      instanceCount: payload.instanceCount,
      strategy: payload.strategy,
    });
  },
  'task:instance-completed': (event) => {
    const payload = (event.payload ?? event) as Record<string, unknown>;
    const instanceId = (payload?.instanceId ?? payload?.taskInstanceId) as string | undefined;
    logger.info(`[Task] Instance completed: ${instanceId}`);
  },
  'task:instance-skipped': (event) => {
    const payload = (event.payload ?? event) as Record<string, unknown>;
    const instanceId = (payload?.instanceId ?? payload?.taskInstanceId) as string | undefined;
    logger.info(`[Task] Instance skipped: ${instanceId}`);
  },
  'task:instance-deleted': (event) => {
    const payload = (event.payload ?? event) as Record<string, unknown>;
    const instanceId = (payload?.instanceId ?? payload?.taskInstanceId) as string | undefined;
    logger.info(`[Task] Instance deleted: ${instanceId}`);
  },
};

/**
 * Creates an instance-owned runtime contribution.
 * 创建实例级 runtime 贡献对象。
 *
 * Replaces the old global initialization pattern with an explicit start/stop lifecycle.
 *
 * 替代旧的全局初始化方式，使用显式的 start/stop 生命周期。
 */
export function createTaskRuntimeContribution(): TaskRuntimeContribution {
  let started = false;

  return {
    start(): void {
      if (started) {
        return;
      }

      for (const [eventName, handler] of Object.entries(taskEventHandlers)) {
        taskEventBus.on(eventName, handler);
      }

      started = true;
      logger.info('[Task] Runtime contribution started');
    },

    stop(): void {
      if (!started) {
        return;
      }

      for (const [eventName, handler] of Object.entries(taskEventHandlers)) {
        taskEventBus.off(eventName, handler);
      }

      started = false;
      logger.info('[Task] Runtime contribution stopped');
    },
  };
}
