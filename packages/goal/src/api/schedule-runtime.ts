import { eventBus } from '@dailyuse/utils/domain';
import { createLogger } from '@dailyuse/utils/logger';
import type {
  GoalEventMap,
  GoalServerDTO,
  ReminderTrigger,
} from '@dailyuse/contracts/goal';
import { GoalStatus, ReminderTriggerType } from '@dailyuse/contracts/goal';
import { SourceModule, TaskPriority } from '@dailyuse/contracts/schedule';
import {
  ScheduleTask,
  type IScheduleTaskRepository,
} from '@dailyuse/schedule/api';
import { ScheduleConfig, ScheduleTaskMetadata } from '@dailyuse/schedule/domain-shared';
import type { IGoalRepository } from '../domain-server';
import type { GoalModuleRuntimeContribution } from '../infrastructure-server';

const logger = createLogger('GoalScheduleRuntime');
const DAY_MS = 24 * 60 * 60 * 1000;

function mapPriority(goal: GoalServerDTO): (typeof TaskPriority)[keyof typeof TaskPriority] {
  if (goal.importance === 'Vital') {
    return TaskPriority.Urgent;
  }
  if (goal.importance === 'Important') {
    return TaskPriority.High;
  }
  return TaskPriority.Normal;
}

function calculateTriggerAt(goal: GoalServerDTO, trigger: ReminderTrigger): number | null {
  if (trigger.type === ReminderTriggerType.RemainingDays) {
    if (!goal.targetDate) {
      return null;
    }
    return goal.targetDate - trigger.value * DAY_MS;
  }

  if (trigger.type === ReminderTriggerType.TimeProgressPercentage) {
    if (!goal.startDate || !goal.targetDate || goal.targetDate <= goal.startDate) {
      return null;
    }
    return goal.startDate + (goal.targetDate - goal.startDate) * (trigger.value / 100);
  }

  return null;
}

function buildTaskName(goal: GoalServerDTO, trigger: ReminderTrigger): string {
  if (trigger.type === ReminderTriggerType.RemainingDays) {
    return `${goal.name} · 剩余 ${trigger.value} 天提醒`;
  }
  return `${goal.name} · 进度 ${trigger.value}% 提醒`;
}

function buildTaskDescription(goal: GoalServerDTO, trigger: ReminderTrigger): string {
  if (trigger.type === ReminderTriggerType.RemainingDays) {
    return `Goal reminder for ${goal.name} when ${trigger.value} day(s) remain`;
  }
  return `Goal reminder for ${goal.name} at ${trigger.value}% time progress`;
}

function shouldScheduleGoal(goal: GoalServerDTO): boolean {
  return (
    goal.status === GoalStatus.Active &&
    !goal.archivedAt &&
    !goal.completedAt &&
    !goal.deletedAt &&
    !!goal.reminderConfig?.enabled &&
    goal.reminderConfig.triggers.some((trigger) => trigger.enabled)
  );
}

export function createGoalScheduleRuntimeContribution(deps: {
  goalRepository: IGoalRepository;
  scheduleTaskRepository: IScheduleTaskRepository;
}): GoalModuleRuntimeContribution {
  const deleteGoalTasks = async (goalId: string, identityId?: string) => {
    const existingTasks = await deps.scheduleTaskRepository.findBySourceEntity(
      SourceModule.Goal,
      goalId,
      identityId,
    );
    if (existingTasks.length === 0) {
      return;
    }

    await deps.scheduleTaskRepository.deleteBatch(existingTasks.map((task) => task.id));
    for (const task of existingTasks) {
      eventBus.send('schedule:task-deleted', { taskId: task.id });
    }
  };

  const syncGoalTasks = async (goalId: string, identityId?: string) => {
    await deleteGoalTasks(goalId, identityId);

    const goal = await deps.goalRepository.findById(goalId, { includeChildren: true });
    if (!goal) {
      return;
    }

    const goalDTO = goal.toServerDTO(true);
    if (!shouldScheduleGoal(goalDTO)) {
      return;
    }

    const triggers = goalDTO.reminderConfig?.triggers.filter((trigger) => trigger.enabled) ?? [];
    const now = Date.now();

    for (const trigger of triggers) {
      const triggerAt = calculateTriggerAt(goalDTO, trigger);
      if (triggerAt === null || triggerAt <= now) {
        continue;
      }

      const scheduleTask = ScheduleTask.create({
        identityId: String(goalDTO.identityId),
        name: buildTaskName(goalDTO, trigger),
        description: buildTaskDescription(goalDTO, trigger),
        sourceModule: SourceModule.Goal,
        sourceEntityId: goalDTO.id,
        schedule: ScheduleConfig.fromDTO({
          cronExpression: null,
          timezone: 'Asia/Shanghai',
          startDate: new Date(triggerAt).toISOString(),
          endDate: null,
          maxExecutions: 1,
        }),
        metadata: ScheduleTaskMetadata.create({
          payload: {
            goalId: goalDTO.id,
            goalTitle: goalDTO.name,
            triggerType: trigger.type,
            triggerValue: trigger.value,
            triggerAt,
          },
          tags: ['goal', 'goal-reminder', `trigger:${trigger.type}`],
          priority: mapPriority(goalDTO),
          timeout: null,
        }),
      });

      await deps.scheduleTaskRepository.save(scheduleTask);
    }
  };

  const handleUpsert = (goalId: string, identityId: unknown) =>
    syncGoalTasks(goalId, String(identityId));

  const handleDelete = (goalId: string, identityId: unknown) =>
    deleteGoalTasks(goalId, String(identityId));

  const onCreated = (e: GoalEventMap['goal:created']) => handleUpsert(e.goal.id, e.identityId);
  const onUpdated = (e: GoalEventMap['goal:updated']) => handleUpsert(e.goal.id, e.identityId);
  const onScheduleTimeChanged = (e: GoalEventMap['goal:schedule-time-changed']) =>
    handleUpsert(e.goal.id, e.identityId);
  const onReminderConfigChanged = (e: GoalEventMap['goal:reminder-config-changed']) =>
    handleUpsert(e.goal.id, e.identityId);
  const onCompleted = (e: GoalEventMap['goal:completed']) => handleDelete(e.goal.id, e.identityId);
  const onArchived = (e: GoalEventMap['goal:archived']) => handleDelete(e.goal.id, e.identityId);
  const onDeleted = (e: GoalEventMap['goal:deleted']) => handleDelete(e.goal.id, e.identityId);

  let started = false;

  return {
    start(): void {
      if (started) {
        return;
      }

      eventBus.on('goal:created', onCreated);
      eventBus.on('goal:updated', onUpdated);
      eventBus.on('goal:schedule-time-changed', onScheduleTimeChanged);
      eventBus.on('goal:reminder-config-changed', onReminderConfigChanged);
      eventBus.on('goal:completed', onCompleted);
      eventBus.on('goal:archived', onArchived);
      eventBus.on('goal:deleted', onDeleted);

      started = true;
      logger.info('[Goal] Schedule projection runtime started');
    },

    stop(): void {
      if (!started) {
        return;
      }

      eventBus.off('goal:created', onCreated);
      eventBus.off('goal:updated', onUpdated);
      eventBus.off('goal:schedule-time-changed', onScheduleTimeChanged);
      eventBus.off('goal:reminder-config-changed', onReminderConfigChanged);
      eventBus.off('goal:completed', onCompleted);
      eventBus.off('goal:archived', onArchived);
      eventBus.off('goal:deleted', onDeleted);

      started = false;
      logger.info('[Goal] Schedule projection runtime stopped');
    },
  };
}
