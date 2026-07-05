import {
  NotificationCategory,
  NotificationChannelType,
  NotificationType,
  RelatedEntityType,
} from '@dailyuse/contracts/notification';
import type { IGoalRepository } from '../domain-server';
import type { GoalScheduleExecutionSource } from '../schedule-execution';

export interface CreateGoalScheduleExecutionSourceDeps {
  readonly goalRepository: Pick<IGoalRepository, 'findById'>;
}

export function createGoalScheduleExecutionSource(
  deps: CreateGoalScheduleExecutionSourceDeps,
): GoalScheduleExecutionSource {
  return {
    async executeGoal(task) {
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

      return {
        nextRunAt: null,
        notification: {
          identityId: String(goal.identityId),
          title: `目标提醒：${goal.name}`,
          content,
          type: NotificationType.Reminder,
          category: NotificationCategory.Goal,
          relatedEntityType: RelatedEntityType.Goal,
          relatedEntityId: goal.id,
          channels: [NotificationChannelType.InApp, NotificationChannelType.Push],
        },
        result: {
          goalId: goal.id,
          goalTitle: goal.name,
          triggerType,
          triggerValue,
        },
      };
    },
  };
}
