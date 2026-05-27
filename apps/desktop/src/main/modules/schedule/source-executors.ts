/**
 * Schedule Source Executors — per-module task execution logic
 *
 * Each executor handles a specific SourceModule (Reminder, Goal, Task),
 * creating the appropriate notification when the scheduled time arrives.
 *
 * Extracted from main.ts registerBusinessModules to improve locality.
 *
 * @module desktop/schedule/source-executors
 */

import type { PowerSyncDatabase } from '@powersync/node';
import { SourceModule } from '@dailyuse/contracts/schedule';
import {
  NotificationType,
  NotificationCategory,
  NotificationChannelType,
  RelatedEntityType,
} from '@dailyuse/contracts/notification';
import { CreateNotificationUseCase } from '@dailyuse/notification/application-server';
import {
  PowerSyncNotificationRepository,
  PowerSyncNotificationTemplateRepository,
  PowerSyncNotificationPreferenceRepository,
} from '@dailyuse/notification/infrastructure-server';
import { ReminderTemplatePowerSyncRepository } from '@dailyuse/reminder/infrastructure-server';
import { GoalPowerSyncRepository } from '@dailyuse/goal/infrastructure-server';
import {
  PowerSyncTaskInstanceRepository,
  PowerSyncTaskTemplateRepository,
} from '@dailyuse/task/infrastructure-server';
import type { ScheduleTask } from '@dailyuse/schedule/domain-server';
import { createLogger } from '@dailyuse/utils/logger';

interface SourceExecutionResult {
  nextRunAt?: number | null;
  result?: Record<string, unknown>;
}

interface DesktopSourceExecutor {
  execute(task: ScheduleTask): Promise<SourceExecutionResult>;
}

const logger = createLogger('DesktopSourceExecutor');

function createNotificationUseCase(db: PowerSyncDatabase): CreateNotificationUseCase {
  return new CreateNotificationUseCase(
    new PowerSyncNotificationRepository(db),
    new PowerSyncNotificationTemplateRepository(db),
    new PowerSyncNotificationPreferenceRepository(db),
  );
}

function mapReminderChannels(channels: unknown): NotificationChannelType[] {
  if (!Array.isArray(channels)) {
    return [NotificationChannelType.InApp];
  }
  return channels.map((ch) => {
    if (typeof ch === 'string') {
      const mapped = NotificationChannelType[ch as keyof typeof NotificationChannelType];
      return mapped ?? NotificationChannelType.InApp;
    }
    return NotificationChannelType.InApp;
  });
}

export async function executeReminderSource(
  task: ScheduleTask,
  db: PowerSyncDatabase,
): Promise<SourceExecutionResult> {
  const createNotification = createNotificationUseCase(db);

  logger.info('[Desktop][ReminderFlow] Source executor received reminder task', {
    taskId: task.id,
    sourceEntityId: task.sourceEntityId,
    nextRunAt: task.nextRunAt?.toISOString() ?? null,
    executionCount: task.execution.executionCount,
  });

  const reminderTemplateRepository = new ReminderTemplatePowerSyncRepository(db);
  const reminder = await reminderTemplateRepository.findById(task.sourceEntityId, {
    includeHistory: true,
  });

  if (!reminder || !reminder.isEffectivelyEnabled() || reminder.deletedAt) {
    logger.warn('[Desktop][ReminderFlow] Reminder execution skipped by source executor', {
      taskId: task.id,
      sourceEntityId: task.sourceEntityId,
      exists: !!reminder,
      effectiveEnabled: reminder?.isEffectivelyEnabled() ?? null,
      deletedAt: reminder?.deletedAt?.toISOString() ?? null,
    });
    return { nextRunAt: null, result: { skipped: true } };
  }

  logger.info('[Desktop][ReminderFlow] Recording reminder trigger', {
    reminderId: reminder.id,
    title: reminder.title,
    previousNextTriggerAt: reminder.nextTriggerAt,
  });
  reminder.recordTrigger();
  await reminderTemplateRepository.save(reminder);

  logger.info('[Desktop][ReminderFlow] Creating notification for triggered reminder', {
    reminderId: reminder.id,
    title: reminder.notificationConfig.title ?? reminder.title,
    channels: mapReminderChannels(reminder.notificationConfig.channels),
    nextTriggerAt: reminder.nextTriggerAt,
  });
  await createNotification.execute({
    identityId: String(reminder.identityId),
    title: reminder.notificationConfig.title ?? reminder.title,
    content: reminder.notificationConfig.body ?? reminder.description ?? '',
    type: NotificationType.Reminder,
    category: NotificationCategory.Reminder,
    relatedEntityType: RelatedEntityType.Reminder,
    relatedEntityId: reminder.id,
    channels: mapReminderChannels(reminder.notificationConfig.channels),
  });

  logger.info('[Desktop][ReminderFlow] Reminder execution completed', {
    reminderId: reminder.id,
    nextTriggerAt: reminder.nextTriggerAt,
  });
  return {
    nextRunAt: reminder.nextTriggerAt,
    result: { reminderId: reminder.id, reminderTitle: reminder.title },
  };
}

export async function executeGoalSource(
  task: ScheduleTask,
  db: PowerSyncDatabase,
): Promise<SourceExecutionResult> {
  const createNotification = createNotificationUseCase(db);
  const goalRepository = new GoalPowerSyncRepository(db);
  const goal = await goalRepository.findById(task.sourceEntityId, { includeChildren: true });

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

  await createNotification.execute({
    identityId: String(goal.identityId),
    title: `目标提醒：${goal.name}`,
    content,
    type: NotificationType.Reminder,
    category: NotificationCategory.Goal,
    relatedEntityType: RelatedEntityType.Goal,
    relatedEntityId: goal.id,
    channels: [NotificationChannelType.InApp, NotificationChannelType.Push],
  });

  return {
    nextRunAt: null,
    result: { goalId: goal.id, goalTitle: goal.name, triggerType, triggerValue },
  };
}

export async function executeTaskSource(
  task: ScheduleTask,
  db: PowerSyncDatabase,
): Promise<SourceExecutionResult> {
  const createNotification = createNotificationUseCase(db);
  const taskInstanceRepository = new PowerSyncTaskInstanceRepository(db);
  const taskTemplateRepository = new PowerSyncTaskTemplateRepository(db);
  const instance = await taskInstanceRepository.findById(task.sourceEntityId);

  if (
    !instance ||
    instance.deletedAt ||
    (instance.status !== 'Pending' && instance.status !== 'InProgress')
  ) {
    return { nextRunAt: null, result: { skipped: true } };
  }

  const template = await taskTemplateRepository.findById(String(instance.templateId));
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

  await createNotification.execute({
    identityId: String(instance.identityId),
    title: `任务提醒：${taskTitle}`,
    content,
    type: NotificationType.Reminder,
    category: NotificationCategory.Task,
    relatedEntityType: RelatedEntityType.Task,
    relatedEntityId: instance.id,
    channels: [NotificationChannelType.InApp, NotificationChannelType.Push],
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

export function createDesktopSourceExecutor(db: PowerSyncDatabase): DesktopSourceExecutor {
  return {
    async execute(task: ScheduleTask): Promise<SourceExecutionResult> {
      if (task.sourceModule === SourceModule.Reminder) {
        return executeReminderSource(task, db);
      }
      if (task.sourceModule === SourceModule.Goal) {
        return executeGoalSource(task, db);
      }
      if (task.sourceModule === SourceModule.Task) {
        return executeTaskSource(task, db);
      }
      throw new Error(`Unsupported schedule source module: ${task.sourceModule}`);
    },
  };
}
