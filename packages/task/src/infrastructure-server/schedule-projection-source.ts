import type {
  ReminderTimeUnit,
  TaskEventMap,
  TaskReminderType,
  TaskTemplateServerDTO,
} from '@dailyuse/contracts/task';
import { TaskInstanceStatus, TaskTimeType } from '@dailyuse/contracts/task';
import { SourceModule, TaskPriority } from '@dailyuse/contracts/schedule';
import { ScheduleTask } from '@dailyuse/schedule';
import { ScheduleConfig, ScheduleTaskMetadata } from '@dailyuse/schedule/domain-shared';
import type {
  ITaskInstanceRepository,
  ITaskTemplateRepository,
} from '../domain-server';

const DEFAULT_ALL_DAY_REMINDER_MINUTES = 9 * 60;

function mapPriority(importance: string): (typeof TaskPriority)[keyof typeof TaskPriority] {
  if (importance === 'Vital') {
    return TaskPriority.Urgent;
  }
  if (importance === 'Important') {
    return TaskPriority.High;
  }
  return TaskPriority.Normal;
}

function formatUnit(unit: ReminderTimeUnit): string {
  switch (unit) {
    case 'Minutes':
      return '分钟';
    case 'Hours':
      return '小时';
    case 'Days':
      return '天';
    default:
      return '';
  }
}

function convertUnitToMs(value: number, unit: ReminderTimeUnit): number {
  switch (unit) {
    case 'Minutes':
      return value * 60 * 1000;
    case 'Hours':
      return value * 60 * 60 * 1000;
    case 'Days':
      return value * 24 * 60 * 60 * 1000;
    default:
      return 0;
  }
}

function getInstanceAnchorTime(instance: {
  instanceDate: number;
  timeConfig: {
    timeType: string;
    timePoint: number | null;
    timeRange?: { start: number; end: number } | null;
  };
}): number {
  const dayStart = instance.instanceDate;

  if (instance.timeConfig.timeType === TaskTimeType.TimePoint) {
    return dayStart + (instance.timeConfig.timePoint ?? DEFAULT_ALL_DAY_REMINDER_MINUTES) * 60 * 1000;
  }

  if (instance.timeConfig.timeType === TaskTimeType.TimeRange) {
    return dayStart + (instance.timeConfig.timeRange?.start ?? DEFAULT_ALL_DAY_REMINDER_MINUTES) * 60 * 1000;
  }

  return dayStart + DEFAULT_ALL_DAY_REMINDER_MINUTES * 60 * 1000;
}

function calculateReminderAt(
  instance: {
    instanceDate: number;
    timeConfig: {
      timeType: string;
      timePoint: number | null;
      timeRange?: { start: number; end: number } | null;
    };
  },
  trigger: {
    type: TaskReminderType;
    absoluteTime: number | null;
    relativeValue: number | null;
    relativeUnit: ReminderTimeUnit | null;
  },
): number | null {
  if (trigger.type === 'Absolute') {
    return trigger.absoluteTime;
  }

  if (trigger.relativeValue === null || trigger.relativeUnit === null) {
    return null;
  }

  return getInstanceAnchorTime(instance) - convertUnitToMs(trigger.relativeValue, trigger.relativeUnit);
}

function buildTaskName(
  template: TaskTemplateServerDTO,
  trigger: {
    type: TaskReminderType;
    absoluteTime: number | null;
    relativeValue: number | null;
    relativeUnit: ReminderTimeUnit | null;
  },
): string {
  if (trigger.type === 'Relative' && trigger.relativeValue !== null && trigger.relativeUnit !== null) {
    return `${template.name} · 提前 ${trigger.relativeValue}${formatUnit(trigger.relativeUnit)} 提醒`;
  }

  return `${template.name} · 定时提醒`;
}

function shouldScheduleTemplate(template: TaskTemplateServerDTO): boolean {
  return (
    template.status === 'Active' &&
    template.deletedAt === null &&
    !!template.reminderConfig?.enabled &&
    template.reminderConfig.triggers.length > 0
  );
}

function isSchedulableInstance(instance: {
  status: string;
  deletedAt: Date | null;
}): boolean {
  return (
    instance.deletedAt === null &&
    (instance.status === TaskInstanceStatus.Pending || instance.status === TaskInstanceStatus.InProgress)
  );
}

export interface TaskScheduleProjectionSelection {
  readonly sourceModule: SourceModule;
  readonly identityId?: string;
  readonly sourceEntityId?: string;
  matches(task: ScheduleTask): boolean;
}

export interface TaskScheduleProjectionPlan {
  readonly selection: TaskScheduleProjectionSelection;
  readonly nextTasks: readonly ScheduleTask[];
}

export interface TaskScheduleProjectionSource {
  buildTemplatePlan(templateId: string, identityId?: string): Promise<TaskScheduleProjectionPlan>;
  buildTemplateDeletionSelection(templateId: string, identityId?: string): TaskScheduleProjectionSelection;
  buildInstanceDeletionSelection(instanceId: string, identityId?: string): TaskScheduleProjectionSelection;
}

export interface TaskScheduleProjectionHandlers {
  upsertTemplate(templateId: string, identityId?: string): Promise<void>;
  deleteTemplate(templateId: string, identityId?: string): Promise<void>;
  deleteInstance(instanceId: string, identityId?: string): Promise<void>;
}

export type TaskScheduleProjectionEventMap = Pick<
  TaskEventMap,
  | 'task:created'
  | 'task:updated'
  | 'task:instance-generated'
  | 'task:template-schedule-time-changed'
  | 'task:template-recurrence-changed'
  | 'task:template-resumed'
  | 'task:deleted'
  | 'task:template-paused'
  | 'task:instance-completed'
  | 'task:instance-skipped'
  | 'task:instance-deleted'
>;

export const taskScheduleProjectionEventNames = [
  'task:created',
  'task:updated',
  'task:instance-generated',
  'task:template-schedule-time-changed',
  'task:template-recurrence-changed',
  'task:template-resumed',
  'task:deleted',
  'task:template-paused',
  'task:instance-completed',
  'task:instance-skipped',
  'task:instance-deleted',
] as const satisfies readonly (keyof TaskScheduleProjectionEventMap)[];

function selectTemplateProjection(
  templateId: string,
  identityId?: string,
): TaskScheduleProjectionSelection {
  return {
    sourceModule: SourceModule.Task,
    identityId,
    matches(task) {
      return task.metadata.payload['templateId'] === templateId;
    },
  };
}

function selectInstanceProjection(
  instanceId: string,
  identityId?: string,
): TaskScheduleProjectionSelection {
  return {
    sourceModule: SourceModule.Task,
    identityId,
    sourceEntityId: instanceId,
    matches(task) {
      return task.sourceEntityId === instanceId;
    },
  };
}

export function createTaskScheduleProjectionSource(deps: {
  taskTemplateRepository: ITaskTemplateRepository;
  taskInstanceRepository: ITaskInstanceRepository;
}): TaskScheduleProjectionSource {
  return {
    async buildTemplatePlan(templateId, identityId) {
      const template = await deps.taskTemplateRepository.findById(templateId);
      if (!template) {
        return {
          selection: selectTemplateProjection(templateId, identityId),
          nextTasks: [],
        };
      }

      const templateDTO = template.toServerDTO();
      const selection = selectTemplateProjection(templateId, String(templateDTO.identityId));

      if (!shouldScheduleTemplate(templateDTO) || !templateDTO.reminderConfig) {
        return {
          selection,
          nextTasks: [],
        };
      }

      const instances = await deps.taskInstanceRepository.findByTemplateId(templateId);
      const now = Date.now();
      const nextTasks = instances
        .filter(isSchedulableInstance)
        .flatMap((instance) =>
          templateDTO.reminderConfig!.triggers
            .map((trigger) => {
              const reminderAt = calculateReminderAt(instance, trigger);
              if (reminderAt === null || reminderAt <= now) {
                return null;
              }

              return ScheduleTask.create({
                identityId: String(templateDTO.identityId),
                name: buildTaskName(templateDTO, trigger),
                description: templateDTO.description ?? undefined,
                sourceModule: SourceModule.Task,
                sourceEntityId: instance.id,
                schedule: ScheduleConfig.fromDTO({
                  cronExpression: null,
                  timezone: 'Asia/Shanghai',
                  startDate: new Date(reminderAt).toISOString(),
                  endDate: null,
                  maxExecutions: 1,
                }),
                metadata: ScheduleTaskMetadata.create({
                  payload: {
                    templateId: templateDTO.id,
                    instanceId: instance.id,
                    taskTitle: templateDTO.name,
                    reminderType: trigger.type,
                    reminderValue: trigger.relativeValue,
                    reminderUnit: trigger.relativeUnit,
                    reminderAbsoluteTime: trigger.absoluteTime,
                    anchorTime: getInstanceAnchorTime(instance),
                    reminderTime: reminderAt,
                  },
                  tags: ['task', 'task-reminder', `template:${templateDTO.id}`],
                  priority: mapPriority(templateDTO.importance),
                  timeout: null,
                }),
              });
            })
            .filter((task): task is ScheduleTask => task !== null),
        );

      return {
        selection,
        nextTasks,
      };
    },

    buildTemplateDeletionSelection(templateId, identityId) {
      return selectTemplateProjection(templateId, identityId);
    },

    buildInstanceDeletionSelection(instanceId, identityId) {
      return selectInstanceProjection(instanceId, identityId);
    },
  };
}

export function createTaskScheduleProjectionEventHandlers(
  handlers: TaskScheduleProjectionHandlers,
): {
  [K in keyof TaskScheduleProjectionEventMap]: (event: TaskScheduleProjectionEventMap[K]) => Promise<void>;
} {
  return {
    'task:created': async (event) =>
      handlers.upsertTemplate(event.templateId, String(event.identityId)),
    'task:updated': async (event) =>
      handlers.upsertTemplate(event.task.id, String(event.identityId)),
    'task:instance-generated': async (event) =>
      handlers.upsertTemplate(event.templateId, String(event.identityId)),
    'task:template-schedule-time-changed': async (event) =>
      handlers.upsertTemplate(event.taskTemplate.id, String(event.identityId)),
    'task:template-recurrence-changed': async (event) =>
      handlers.upsertTemplate(event.taskTemplate.id, String(event.identityId)),
    'task:template-resumed': async (event) =>
      handlers.upsertTemplate(event.taskTemplateId, String(event.identityId)),
    'task:deleted': async (event) =>
      handlers.deleteTemplate(event.taskTemplateId, String(event.identityId)),
    'task:template-paused': async (event) =>
      handlers.deleteTemplate(event.taskTemplateId, String(event.identityId)),
    'task:instance-completed': async (event) =>
      handlers.deleteInstance(event.taskInstanceId, String(event.identityId)),
    'task:instance-skipped': async (event) =>
      handlers.deleteInstance(event.taskInstanceId, String(event.identityId)),
    'task:instance-deleted': async (event) =>
      handlers.deleteInstance(event.taskInstanceId, String(event.identityId)),
  };
}
