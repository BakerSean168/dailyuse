import type {
  GoalEventMap,
  GoalServerDTO,
  ReminderTrigger,
  ReminderTriggerType,
} from '@memoflow/contracts/goal';
import { GoalStatus, ReminderTriggerType as GoalReminderTriggerType } from '@memoflow/contracts/goal';
import type { ScheduledIntent, SchedulingOwner } from '@memoflow/contracts/schedule';
import { buildSchedulingKey } from '@memoflow/contracts/schedule';
import { asInstant, defaultTime, type TimeFacade } from '@memoflow/time';
import type { IGoalRepository } from '../domain';

export const GOAL_REMINDER_HANDLER_KEY = 'goal.reminder.fire';
export const GOAL_REMINDER_PAYLOAD_VERSION = 1;
const GOAL_SCHEDULING_OWNER_TYPE = 'goal';

export interface GoalReminderScheduledPayload {
  readonly goalId: string;
  readonly goalName: string;
  readonly triggerType: ReminderTriggerType;
  readonly triggerValue: number;
  readonly startDate: number | null;
  readonly dueDate: number;
  readonly reminderTime: number;
}

export interface GoalScheduleProjectionPlan {
  readonly owner: SchedulingOwner;
  readonly desired: readonly ScheduledIntent<GoalReminderScheduledPayload>[];
}

export interface GoalScheduleProjectionSource {
  buildGoalPlan(goalId: string, identityId: string): Promise<GoalScheduleProjectionPlan>;
  buildGoalOwner(goalId: string, identityId: string): SchedulingOwner;
  /** Full source scan used by startup reconcile / lost-event repair. */
  listGoalRefs?(): Promise<Array<{ goalId: string; identityId: string }>>;
}

export interface GoalScheduleProjectionHandlers {
  upsertGoal(goalId: string, identityId: string): Promise<void>;
  deleteGoal(goalId: string, identityId: string): Promise<void>;
}

export type GoalScheduleProjectionEventMap = Pick<
  GoalEventMap,
  | 'goal:created'
  | 'goal:updated'
  | 'goal:status-changed'
  | 'goal:schedule-time-changed'
  | 'goal:reminder-config-changed'
  | 'goal:completed'
  | 'goal:archived'
  | 'goal:deleted'
>;

export const goalScheduleProjectionEventNames = [
  'goal:created',
  'goal:updated',
  'goal:status-changed',
  'goal:schedule-time-changed',
  'goal:reminder-config-changed',
  'goal:completed',
  'goal:archived',
  'goal:deleted',
] as const satisfies readonly (keyof GoalScheduleProjectionEventMap)[];

function calculateTriggerAt(
  goal: GoalServerDTO,
  trigger: ReminderTrigger,
  time: Pick<TimeFacade, 'engine'>,
): number | null {
  if (trigger.type === GoalReminderTriggerType.RemainingDays) {
    if (goal.dueDate == null || !Number.isFinite(trigger.value)) return null;
    return Number(time.engine.addDays(asInstant(Number(goal.dueDate)), -trigger.value));
  }

  if (trigger.type === GoalReminderTriggerType.TimeProgressPercentage) {
    if (
      goal.startDate == null ||
      goal.dueDate == null ||
      goal.dueDate <= goal.startDate ||
      !Number.isFinite(trigger.value)
    ) {
      return null;
    }
    return Math.round(goal.startDate + (goal.dueDate - goal.startDate) * (trigger.value / 100));
  }

  return null;
}

function buildIntentName(goal: GoalServerDTO, trigger: ReminderTrigger): string {
  if (trigger.type === GoalReminderTriggerType.RemainingDays) {
    return `${goal.name} · 剩余 ${trigger.value} 天提醒`;
  }
  return `${goal.name} · 进度 ${trigger.value}% 提醒`;
}

function triggerIdentity(trigger: ReminderTrigger): string {
  if (trigger.type === GoalReminderTriggerType.RemainingDays) {
    return `remaining-days:${String(trigger.value)}`;
  }
  return `time-progress:${String(trigger.value)}`;
}

function shouldScheduleGoal(goal: GoalServerDTO): boolean {
  return (
    goal.status === GoalStatus.Active &&
    goal.archivedAt == null &&
    goal.completedAt == null &&
    goal.deletedAt == null &&
    goal.dueDate != null &&
    !!goal.reminderConfig?.enabled &&
    goal.reminderConfig.triggers.some((trigger) => trigger.enabled)
  );
}

function goalOwner(goalId: string, identityId: string): SchedulingOwner {
  return { identityId, type: GOAL_SCHEDULING_OWNER_TYPE, id: goalId };
}

export function createGoalScheduleProjectionSource(deps: {
  goalRepository: IGoalRepository;
  time?: Pick<TimeFacade, 'now' | 'engine'>;
}): GoalScheduleProjectionSource {
  const time = deps.time ?? defaultTime;

  return {
    buildGoalOwner(goalId, identityId) {
      return goalOwner(goalId, identityId);
    },

    async listGoalRefs() {
      const refs = await deps.goalRepository.findAllGoalRefs();
      return refs.map((ref) => ({ goalId: ref.id, identityId: ref.identityId }));
    },

    async buildGoalPlan(goalId, identityId) {
      const owner = goalOwner(goalId, identityId);
      const goal = await deps.goalRepository.findByIdForIdentity(identityId, goalId, {
        includeChildren: true,
      });
      if (!goal) return { owner, desired: [] };

      const goalDTO = goal.toServerDTO(true);
      const canonicalOwner = goalOwner(goalId, String(goalDTO.identityId));
      if (!shouldScheduleGoal(goalDTO) || !goalDTO.reminderConfig || goalDTO.dueDate == null) {
        return { owner: canonicalOwner, desired: [] };
      }

      const now = Number(time.now());
      const desiredByKey = new Map<string, ScheduledIntent<GoalReminderScheduledPayload>>();

      for (const trigger of goalDTO.reminderConfig.triggers.filter((candidate) => candidate.enabled)) {
        const runAt = calculateTriggerAt(goalDTO, trigger, time);
        if (runAt === null || runAt <= now) continue;

        const schedulingKey = buildSchedulingKey(
          'goal.reminder',
          goalDTO.id,
          triggerIdentity(trigger),
        );
        if (desiredByKey.has(schedulingKey)) continue;

        desiredByKey.set(schedulingKey, {
          schedulingKey,
          handlerKey: GOAL_REMINDER_HANDLER_KEY,
          runAt,
          payloadVersion: GOAL_REMINDER_PAYLOAD_VERSION,
          payload: {
            goalId: goalDTO.id,
            goalName: goalDTO.name,
            triggerType: trigger.type,
            triggerValue: trigger.value,
            startDate: goalDTO.startDate,
            dueDate: goalDTO.dueDate,
            reminderTime: runAt,
          },
          sourceRevision: String(goalDTO.version),
          priority: 'normal',
          timeoutMs: null,
          observability: {
            name: buildIntentName(goalDTO, trigger),
            tags: ['goal', 'goal-reminder', `trigger:${trigger.type}`],
          },
        });
      }

      return { owner: canonicalOwner, desired: [...desiredByKey.values()] };
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
    'goal:status-changed': async (event) =>
      handlers.upsertGoal(event.goal.id, String(event.identityId)),
    'goal:schedule-time-changed': async (event) =>
      handlers.upsertGoal(event.goal.id, String(event.identityId)),
    'goal:reminder-config-changed': async (event) =>
      handlers.upsertGoal(event.goal.id, String(event.identityId)),
    'goal:completed': async (event) => handlers.deleteGoal(event.goal.id, String(event.identityId)),
    'goal:archived': async (event) => handlers.deleteGoal(event.goal.id, String(event.identityId)),
    'goal:deleted': async (event) => handlers.deleteGoal(event.goal.id, String(event.identityId)),
  };
}
