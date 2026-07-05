import {
  NotificationCategory,
  NotificationChannelType,
  NotificationType,
  RelatedEntityType,
} from '@dailyuse/contracts/notification';
import type { ScheduleTask } from '@dailyuse/schedule';
import type { ITaskInstanceRepository } from '../domain-server/repositories/i-task-instance-repository';
import type { ITaskTemplateRepository } from '../domain-server/repositories/i-task-template-repository';
import type { TaskScheduleExecutionSource } from '../schedule-execution';

export interface CreateTaskScheduleExecutionSourceDeps {
  readonly taskInstanceRepository: Pick<ITaskInstanceRepository, 'findById'>;
  readonly taskTemplateRepository: Pick<ITaskTemplateRepository, 'findById'>;
}

export function createTaskScheduleExecutionSource(
  deps: CreateTaskScheduleExecutionSourceDeps,
): TaskScheduleExecutionSource {
  return {
    async executeTask(task) {
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

      return {
        nextRunAt: null,
        notification: {
          identityId: String(instance.identityId),
          title: `任务提醒：${taskTitle}`,
          content,
          type: NotificationType.Reminder,
          category: NotificationCategory.Task,
          relatedEntityType: RelatedEntityType.Task,
          relatedEntityId: instance.id,
          channels: [NotificationChannelType.InApp, NotificationChannelType.Push],
        },
        result: {
          instanceId: instance.id,
          templateId: String(instance.templateId),
          taskTitle,
          reminderType,
          reminderValue,
          reminderUnit,
        },
      };
    },
  };
}
