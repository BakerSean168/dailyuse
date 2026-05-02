import { createLogger, eventBus } from '@dailyuse/utils';
import type {
  ReminderTimeUnit,
  TaskEventMap,
  TaskReminderType,
  TaskTemplateServerDTO,
} from '@dailyuse/contracts/task';
import { TaskInstanceStatus, TaskTimeType } from '@dailyuse/contracts/task';
import { SourceModule, TaskPriority } from '@dailyuse/contracts/schedule';
import {
  ScheduleTask,
  type IScheduleTaskRepository,
} from '@dailyuse/schedule/domain-server';
import { ScheduleConfig, ScheduleTaskMetadata } from '@dailyuse/schedule/domain-shared';
import type { TaskModuleRuntimeContribution } from '../infrastructure-server';
import type { ITaskInstanceRepository, ITaskTemplateRepository } from '../domain-server';

const logger = createLogger('TaskScheduleRuntime');
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
    return (
      dayStart + (instance.timeConfig.timeRange?.start ?? DEFAULT_ALL_DAY_REMINDER_MINUTES) * 60 * 1000
    );
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

export function createTaskScheduleRuntimeContribution(deps: {
  taskTemplateRepository: ITaskTemplateRepository;
  taskInstanceRepository: ITaskInstanceRepository;
  scheduleTaskRepository: IScheduleTaskRepository;
}): TaskModuleRuntimeContribution {
  const deleteTaskReminderTasks = async (templateId: string, identityId?: string) => {
    const existingTasks = await deps.scheduleTaskRepository.findBySourceModule(
      SourceModule.Task,
      identityId,
    );
    const tasksToDelete = existingTasks.filter(
      (task) => task.metadata.payload['templateId'] === templateId,
    );

    if (tasksToDelete.length === 0) {
      return;
    }

    await deps.scheduleTaskRepository.deleteBatch(tasksToDelete.map((task) => task.id));
    for (const task of tasksToDelete) {
      (eventBus as any).send('schedule:task:deleted', { taskId: task.id });
    }
  };

  const deleteInstanceReminderTasks = async (instanceId: string, identityId?: string) => {
    const existingTasks = await deps.scheduleTaskRepository.findBySourceEntity(
      SourceModule.Task,
      instanceId,
      identityId,
    );
    if (existingTasks.length === 0) {
      return;
    }

    await deps.scheduleTaskRepository.deleteBatch(existingTasks.map((task) => task.id));
    for (const task of existingTasks) {
      (eventBus as any).send('schedule:task:deleted', { taskId: task.id });
    }
  };

  const syncTaskReminderTasks = async (templateId: string, identityId?: string) => {
    await deleteTaskReminderTasks(templateId, identityId);

    const template = await deps.taskTemplateRepository.findById(templateId);
    if (!template) {
      return;
    }

    const templateDTO = template.toServerDTO();
    if (!shouldScheduleTemplate(templateDTO) || !templateDTO.reminderConfig) {
      return;
    }

    const instances = await deps.taskInstanceRepository.findByTemplateId(templateId);
    const now = Date.now();
    const scheduleTasks = instances
      .filter(isSchedulableInstance)
      .flatMap((instance) => {
        return templateDTO.reminderConfig!.triggers
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
          .filter((task): task is ScheduleTask => task !== null);
      });

    if (scheduleTasks.length > 0) {
      await deps.scheduleTaskRepository.saveBatch(scheduleTasks);
    }
  };

  const upsertFromEvent = async (
    event:
      | TaskEventMap['task:created']
      | TaskEventMap['task:updated']
      | TaskEventMap['task:instances:generated']
      | TaskEventMap['task:template:schedule-time-changed']
      | TaskEventMap['task:template:recurrence-changed']
      | TaskEventMap['task:template:resumed'],
  ) => {
    let templateId: string;

    if ('templateId' in event) {
      templateId = event.templateId;
    } else if ('taskTemplateId' in event) {
      templateId = event.taskTemplateId;
    } else if ('taskTemplate' in event) {
      templateId = event.taskTemplate.id;
    } else {
      templateId = event.task.id;
    }

    await syncTaskReminderTasks(templateId, String(event.identityId));
  };

  const deleteFromEvent = async (
    event: TaskEventMap['task:deleted'] | TaskEventMap['task:template:paused'],
  ) => {
    await deleteTaskReminderTasks(event.taskTemplateId, String(event.identityId));
  };

  const deleteCompletedInstanceTasks = async (
    event:
      | TaskEventMap['task:instance:completed']
      | TaskEventMap['task:instance:skipped']
      | TaskEventMap['task:instance:deleted'],
  ) => {
    await deleteInstanceReminderTasks(event.taskInstanceId, String(event.identityId));
  };

  let started = false;

  return {
    start(): void {
      if (started) {
        return;
      }

      eventBus.on('task:created', upsertFromEvent as any);
      eventBus.on('task:updated', upsertFromEvent as any);
      eventBus.on('task:instances:generated', upsertFromEvent as any);
      eventBus.on('task:template:schedule-time-changed', upsertFromEvent as any);
      eventBus.on('task:template:recurrence-changed', upsertFromEvent as any);
      eventBus.on('task:template:resumed', upsertFromEvent as any);
      eventBus.on('task:deleted', deleteFromEvent as any);
      eventBus.on('task:template:paused', deleteFromEvent as any);
      eventBus.on('task:instance:completed', deleteCompletedInstanceTasks as any);
      eventBus.on('task:instance:skipped', deleteCompletedInstanceTasks as any);
      eventBus.on('task:instance:deleted', deleteCompletedInstanceTasks as any);

      started = true;
      logger.info('[Task] Schedule projection runtime started');
    },

    stop(): void {
      if (!started) {
        return;
      }

      eventBus.off('task:created', upsertFromEvent as any);
      eventBus.off('task:updated', upsertFromEvent as any);
      eventBus.off('task:instances:generated', upsertFromEvent as any);
      eventBus.off('task:template:schedule-time-changed', upsertFromEvent as any);
      eventBus.off('task:template:recurrence-changed', upsertFromEvent as any);
      eventBus.off('task:template:resumed', upsertFromEvent as any);
      eventBus.off('task:deleted', deleteFromEvent as any);
      eventBus.off('task:template:paused', deleteFromEvent as any);
      eventBus.off('task:instance:completed', deleteCompletedInstanceTasks as any);
      eventBus.off('task:instance:skipped', deleteCompletedInstanceTasks as any);
      eventBus.off('task:instance:deleted', deleteCompletedInstanceTasks as any);

      started = false;
      logger.info('[Task] Schedule projection runtime stopped');
    },
  };
}
