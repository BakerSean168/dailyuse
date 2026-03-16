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

import { createLogger, eventBus } from '@dailyuse/utils';
import type { IDomainEvent } from '@dailyuse/contracts/shared';
import type { TaskModuleRuntimeContribution } from '../infrastructure-server/task.module';

const logger = createLogger('TaskRuntime');

/**
 * Runtime contribution contract used by module transports.
 * 模块传输层使用的运行时贡献契约。
 */
export type TaskRuntimeContribution = TaskModuleRuntimeContribution;

// Cast eventBus to any for custom event types not in AppEventRegistry
// 将 eventBus 转换为 any 以支持未在 AppEventRegistry 中注册的自定义事件类型
const customEventBus = eventBus as any;

/**
 * Task domain event handlers.
 * 任务领域事件处理器。
 */
const taskEventHandlers: Record<string, (event: IDomainEvent) => void> = {
  'task:instances:generated': (event) => {
    const payload = event.payload ?? event;
    logger.info(`[Task] Instances generated for template: ${payload.templateId}`, {
      templateId: payload.templateId,
      instanceCount: payload.instanceCount,
      strategy: payload.strategy,
    });
  },
  'task:template:created': (event) => {
    const payload = event.payload ?? event;
    logger.info(`[Task] Template created: ${payload.templateId}`);
  },
  'task:instance:completed': (event) => {
    const payload = event.payload ?? event;
    const instanceId = payload?.instanceId ?? payload?.taskInstanceId;
    logger.info(`[Task] Instance completed: ${instanceId}`);
  },
};

/**
 * Creates an instance-owned runtime contribution.
 * 创建实例级 runtime 贡献对象。
 *
 * Replaces the old `registerTaskInitializationTasks()` and static
 * `TaskEventHandler.initialize()` with an explicit start/stop lifecycle.
 *
 * 替代旧的 `registerTaskInitializationTasks()` 和静态
 * `TaskEventHandler.initialize()`，使用显式的 start/stop 生命周期。
 */
export function createTaskRuntimeContribution(): TaskRuntimeContribution {
  let started = false;

  return {
    start(): void {
      if (started) {
        return;
      }

      for (const [eventName, handler] of Object.entries(taskEventHandlers)) {
        customEventBus.on(eventName, handler);
      }

      started = true;
      logger.info('[Task] Runtime contribution started');
    },

    stop(): void {
      if (!started) {
        return;
      }

      for (const [eventName, handler] of Object.entries(taskEventHandlers)) {
        customEventBus.off(eventName, handler);
      }

      started = false;
      logger.info('[Task] Runtime contribution stopped');
    },
  };
}
