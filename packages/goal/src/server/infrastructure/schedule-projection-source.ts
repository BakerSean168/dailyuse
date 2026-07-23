import type {
  GoalEventMap,
  GoalServerDTO,
  ReminderTrigger,
} from '@dailyuse/contracts/goal';
import { GoalStatus, ReminderTriggerType } from '@dailyuse/contracts/goal';
import { SourceModule, Timezone, mapImportanceToTaskPriority } from '@dailyuse/contracts/schedule';
import { ScheduleTask } from '@dailyuse/schedule';
import type { IGoalRepository } from '../domain';

const DAY_MS = 24 * 60 * 60 * 1000;

/** Soft residual 1168: dual mapPriority retired onto contracts mapImportanceToTaskPriority sole. */

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

export interface GoalScheduleProjectionSelection {
  readonly sourceModule: SourceModule;
  readonly identityId: string;
  readonly sourceEntityId?: string;
  matches(task: ScheduleTask): boolean;
}

export interface GoalScheduleProjectionPlan {
  readonly selection: GoalScheduleProjectionSelection;
  readonly nextTasks: readonly ScheduleTask[];
}

export interface GoalScheduleProjectionSource {
  buildGoalPlan(goalId: string, identityId: string): Promise<GoalScheduleProjectionPlan>;
  buildGoalDeletionSelection(goalId: string, identityId: string): GoalScheduleProjectionSelection;
}

export interface GoalScheduleProjectionHandlers {
  upsertGoal(goalId: string, identityId: string): Promise<void>;
  deleteGoal(goalId: string, identityId: string): Promise<void>;
}

export type GoalScheduleProjectionEventMap = Pick<
  GoalEventMap,
  | 'goal:created'
  | 'goal:updated'
  | 'goal:schedule-time-changed'
  | 'goal:reminder-config-changed'
  | 'goal:completed'
  | 'goal:archived'
  | 'goal:deleted'
>;

function selectGoalProjection(
  goalId: string,
  identityId: string,
): GoalScheduleProjectionSelection {
  return {
    sourceModule: SourceModule.Goal,
    sourceEntityId: goalId,
    identityId,
    matches(task) {
      return task.sourceEntityId === goalId;
    },
  };
}

export function createGoalScheduleProjectionSource(deps: {
  goalRepository: IGoalRepository;
}): GoalScheduleProjectionSource {
  return {
    async buildGoalPlan(goalId, identityId) {
      const goal = await deps.goalRepository.findByIdForIdentity(identityId, goalId, {
        includeChildren: true,
      });
      if (!goal) {
        return {
          selection: selectGoalProjection(goalId, identityId),
          nextTasks: [],
        };
      }

      const goalDTO = goal.toServerDTO(true);
      const selection = selectGoalProjection(goalId, String(goalDTO.identityId));
      if (!shouldScheduleGoal(goalDTO) || !goalDTO.reminderConfig) {
        return {
          selection,
          nextTasks: [],
        };
      }

      const triggers = goalDTO.reminderConfig.triggers.filter((trigger) => trigger.enabled);
      const now = Date.now();
      const nextTasks = triggers
        .map((trigger) => {
          const triggerAt = calculateTriggerAt(goalDTO, trigger);
          if (triggerAt === null || triggerAt <= now) {
            return null;
          }

          return ScheduleTask.create({
            identityId: String(goalDTO.identityId),
            name: buildTaskName(goalDTO, trigger),
            description: buildTaskDescription(goalDTO, trigger),
            sourceModule: SourceModule.Goal,
            sourceEntityId: goalDTO.id,
            schedule: {
              cronExpression: null,
              timezone: Timezone.Shanghai,
              startDate: new Date(triggerAt).toISOString(),
              endDate: null,
              maxExecutions: 1,
            },
            metadata: {
              payload: {
                goalId: goalDTO.id,
                goalTitle: goalDTO.name,
                triggerType: trigger.type,
                triggerValue: trigger.value,
                triggerAt,
              },
              tags: ['goal', 'goal-reminder', `trigger:${trigger.type}`],
              priority: mapImportanceToTaskPriority(goalDTO.importance),
              timeout: null,
            },
          });
        })
        .filter((task): task is ScheduleTask => task !== null);

      return {
        selection,
        nextTasks,
      };
    },

    buildGoalDeletionSelection(goalId, identityId) {
      return selectGoalProjection(goalId, identityId);
    },
  };
}

export function createGoalScheduleProjectionEventHandlers(
  handlers: GoalScheduleProjectionHandlers,
): {
  [K in keyof GoalScheduleProjectionEventMap]: (
    event: GoalScheduleProjectionEventMap[K],
  ) => Promise<void>;
} {
  return {
    'goal:created': async (event) => handlers.upsertGoal(event.goal.id, String(event.identityId)),
    'goal:updated': async (event) => handlers.upsertGoal(event.goal.id, String(event.identityId)),
    'goal:schedule-time-changed': async (event) =>
      handlers.upsertGoal(event.goal.id, String(event.identityId)),
    'goal:reminder-config-changed': async (event) =>
      handlers.upsertGoal(event.goal.id, String(event.identityId)),
    'goal:completed': async (event) => handlers.deleteGoal(event.goal.id, String(event.identityId)),
    'goal:archived': async (event) => handlers.deleteGoal(event.goal.id, String(event.identityId)),
    'goal:deleted': async (event) => handlers.deleteGoal(event.goal.id, String(event.identityId)),
  };
}
