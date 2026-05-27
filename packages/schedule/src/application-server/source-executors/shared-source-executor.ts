/**
 * Shared Source Executor
 *
 * Implements the ScheduleTaskSourceExecutor interface using domain-agnostic ports.
 * Both API (Prisma) and Desktop (PowerSync) provide their own port adapters,
 * then use this shared executor to avoid duplicating business logic.
 *
 * @module schedule/source-executors
 */

import { createLogger } from '@dailyuse/utils/logger';
import { SourceModule } from '../../domain-shared/value-objects/source-module';
import type { ScheduleTask } from '../../domain-server/aggregates/schedule-task';
import type { ScheduleTaskExecutionResult, ScheduleTaskSourceExecutor } from '../../api/runtime';
import type { SourceExecutorDependencies } from './types';

const logger = createLogger('SharedSourceExecutor');

function mapReminderChannels(channels: unknown): string[] {
  if (!Array.isArray(channels)) {
    return ['InApp'];
  }
  return channels.map((ch) => (typeof ch === 'string' ? ch : 'InApp'));
}

async function executeReminderSource(
  task: ScheduleTask,
  deps: SourceExecutorDependencies,
): Promise<ScheduleTaskExecutionResult> {
  logger.info('[ReminderFlow] Executing reminder source', {
    taskId: task.id,
    sourceEntityId: task.sourceEntityId,
  });

  const reminder = await deps.reminderRepository.findById(task.sourceEntityId, {
    includeHistory: true,
  });

  if (!reminder || !reminder.isEffectivelyEnabled() || reminder.deletedAt) {
    logger.warn('[ReminderFlow] Reminder skipped', {
      taskId: task.id,
      exists: !!reminder,
    });
    return { nextRunAt: null, result: { skipped: true } };
  }

  reminder.recordTrigger();
  await deps.reminderRepository.save(reminder);

  await deps.createNotification.execute({
    identityId: String(reminder.identityId),
    title: reminder.notificationConfig.title ?? reminder.title,
    content: reminder.notificationConfig.body ?? reminder.description ?? '',
    type: 'Reminder',
    category: 'Reminder',
    relatedEntityType: 'Reminder',
    relatedEntityId: reminder.id,
    channels: mapReminderChannels(reminder.notificationConfig.channels),
  });

  logger.info('[ReminderFlow] Completed', {
    reminderId: reminder.id,
    nextTriggerAt: reminder.nextTriggerAt,
  });

  return {
    nextRunAt: reminder.nextTriggerAt,
    result: { reminderId: reminder.id, reminderTitle: reminder.title },
  };
}

async function executeGoalSource(
  task: ScheduleTask,
  deps: SourceExecutorDependencies,
): Promise<ScheduleTaskExecutionResult> {
  const goal = await deps.goalRepository.findById(task.sourceEntityId, {
    includeChildren: true,
  });

  if (
    !goal ||
    goal.deletedAt ||
    goal.archivedAt ||
    goal.completedAt ||
    goal.status !== 'Active' ||
    !goal.reminderConfig?.enabled
  ) {
    return { nextRunAt: null, result: { skipped: true } };
  }

  const payload = task.metadata.toDTO().payload;
  const triggerType =
    typeof payload['triggerType'] === 'string' ? payload['triggerType'] : undefined;
  const triggerValue =
    typeof payload['triggerValue'] === 'number' ? payload['triggerValue'] : undefined;
  const content =
    triggerType === 'RemainingDays' && triggerValue !== undefined
      ? `目标「${goal.name}」距离截止还有 ${triggerValue} 天。`
      : triggerType === 'TimeProgressPercentage' && triggerValue !== undefined
        ? `目标「${goal.name}」已达到 ${triggerValue}% 时间进度节点。`
        : (goal.description ?? `目标「${goal.name}」已到达提醒时间。`);

  await deps.createNotification.execute({
    identityId: String(goal.identityId),
    title: `目标提醒：${goal.name}`,
    content,
    type: 'Reminder',
    category: 'Goal',
    relatedEntityType: 'Goal',
    relatedEntityId: goal.id,
    channels: ['InApp', 'Push'],
  });

  return {
    nextRunAt: null,
    result: { goalId: goal.id, goalTitle: goal.name, triggerType, triggerValue },
  };
}

async function executeTaskSource(
  task: ScheduleTask,
  deps: SourceExecutorDependencies,
): Promise<ScheduleTaskExecutionResult> {
  const instance = await deps.taskInstanceRepository.findById(task.sourceEntityId);

  if (
    !instance ||
    instance.deletedAt ||
    (instance.status !== 'Pending' && instance.status !== 'InProgress')
  ) {
    return { nextRunAt: null, result: { skipped: true } };
  }

  const template = await deps.taskTemplateRepository.findById(String(instance.templateId));
  const payload = task.metadata.toDTO().payload;
  const taskTitle =
    typeof payload['taskTitle'] === 'string'
      ? payload['taskTitle']
      : (template?.title ?? '未命名任务');
  const reminderType =
    typeof payload['reminderType'] === 'string' ? payload['reminderType'] : undefined;
  const reminderValue =
    typeof payload['reminderValue'] === 'number' ? payload['reminderValue'] : undefined;
  const reminderUnit =
    typeof payload['reminderUnit'] === 'string' ? payload['reminderUnit'] : undefined;
  const content =
    reminderType === 'Relative' && reminderValue !== undefined && reminderUnit
      ? `任务「${taskTitle}」的提前 ${reminderValue}${reminderUnit} 提醒已到达。`
      : `任务「${taskTitle}」已到达提醒时间。`;

  await deps.createNotification.execute({
    identityId: String(instance.identityId),
    title: `任务提醒：${taskTitle}`,
    content,
    type: 'Reminder',
    category: 'Task',
    relatedEntityType: 'Task',
    relatedEntityId: instance.id,
    channels: ['InApp', 'Push'],
  });

  return {
    nextRunAt: null,
    result: {
      instanceId: instance.id,
      templateId: String(instance.templateId),
      taskTitle,
      reminderType,
      reminderValue,
      reminderUnit,
    },
  };
}

/**
 * Create a shared source executor that handles Reminder, Goal, and Task sources.
 *
 * Apps provide port implementations (Prisma or PowerSync adapters) and get back
 * a ScheduleTaskSourceExecutor with the shared business logic.
 *
 * @example
 * ```typescript
 * const executor = createSharedSourceExecutor({
 *   reminderRepository: new ReminderTemplatePrismaRepository(prisma),
 *   goalRepository: new GoalPrismaRepository(prisma),
 *   taskInstanceRepository: new TaskInstancePrismaRepository(prisma),
 *   taskTemplateRepository: new TaskTemplatePrismaRepository(prisma),
 *   createNotification: new CreateNotificationUseCase(...),
 * });
 * ```
 */
export function createSharedSourceExecutor(
  deps: SourceExecutorDependencies,
): ScheduleTaskSourceExecutor {
  return {
    async execute(task: ScheduleTask): Promise<ScheduleTaskExecutionResult> {
      if (task.sourceModule === SourceModule.Reminder) {
        return executeReminderSource(task, deps);
      }
      if (task.sourceModule === SourceModule.Goal) {
        return executeGoalSource(task, deps);
      }
      if (task.sourceModule === SourceModule.Task) {
        return executeTaskSource(task, deps);
      }
      throw new Error(`Unsupported schedule source module: ${task.sourceModule}`);
    },
  };
}
