/**
 * executeScheduleTask - 执行调度任务
 *
 * 由调度器在任务到期时调用
 *
 * @module desktop/main/modules/schedule/application/services
 */

import type { ScheduledItem } from '@dailyuse/schedule/application-server';
import { ScheduleContainer } from '@dailyuse/schedule/infrastructure-server';
import { eventBus } from '@dailyuse/utils';

/**
 * 执行调度任务
 *
 * @param taskUuid 任务 UUID
 * @param item 调度项信息
 */
export async function executeScheduleTask(
  taskUuid: string,
  _item: ScheduledItem
): Promise<void> {
  const container = ScheduleContainer.getInstance();
  const repository = container.getScheduleTaskRepository();

  // 1. 从数据库加载任务
  const task = await repository.findByUuid(taskUuid);
  if (!task) {
    console.error(`[executeScheduleTask] Task not found: ${taskUuid}`);
    throw new Error(`Task not found: ${taskUuid}`);
  }

  const taskName = task.taskName;
  console.info(`[executeScheduleTask] Executing task: ${taskName} (${taskUuid})`);

  // 2. 检查任务是否可执行
  if (!task.canExecute()) {
    const reason = getCannotExecuteReason(task);
    console.warn(
      `[executeScheduleTask] Task cannot be executed: ${taskName} - ${reason}`
    );
    return;
  }

  // 3. 执行任务（调用聚合根方法）
  const success = task.execute();
  if (!success) {
    throw new Error('Task.execute() returned false');
  }

  // 4. 保存任务状态
  await repository.save(task);

  // 5. 发布领域事件
  const events = task.getDomainEvents();
  for (const event of events) {
    console.debug(
      `[executeScheduleTask] Publishing domain event: ${event.eventType}`
    );
    eventBus.emit(event.eventType, event);
  }

  // 6. 清除已发布的事件
  task.clearDomainEvents();

  console.info(`[executeScheduleTask] Task executed successfully: ${taskName}`);
}

/**
 * 获取任务不可执行的原因
 */
function getCannotExecuteReason(task: {
  status: string;
  enabled: boolean;
  nextRunAt: Date | null;
}): string {
  if (task.status !== 'active') {
    return `Status is not active: ${task.status}`;
  }
  if (!task.enabled) {
    return 'Task is disabled';
  }
  const nextRunAt = task.nextRunAt;
  if (!nextRunAt || nextRunAt > new Date()) {
    return `Not due yet: ${nextRunAt?.toISOString() || 'N/A'}`;
  }
  return 'Unknown reason';
}
