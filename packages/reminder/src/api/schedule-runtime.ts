import { eventBus } from '@dailyuse/utils/domain';
import { createLogger } from '@dailyuse/utils/logger';
import { ReminderType, type ReminderEventMap } from '@dailyuse/contracts/reminder';
import { SourceModule } from '@dailyuse/contracts/schedule';
import { ScheduleTask, type IScheduleTaskRepository } from '@dailyuse/schedule/api';
import { ScheduleConfig, ScheduleTaskMetadata, Timezone } from '@dailyuse/schedule/domain-shared';
import type { IReminderTemplateRepository } from '../domain-server/repositories/i-reminder-template-repository';
import type { ReminderModuleRuntimeContribution } from '../infrastructure-server';

const logger = createLogger('ReminderScheduleRuntime');

export function createReminderScheduleRuntimeContribution(deps: {
  reminderTemplateRepository: IReminderTemplateRepository;
  scheduleTaskRepository: IScheduleTaskRepository;
}): ReminderModuleRuntimeContribution {
  const syncReminderTask = async (templateId: string, identityId?: string) => {
    logger.info('[Reminder->Schedule] Syncing reminder projection', {
      templateId,
      identityId,
    });

    const existingTasks = await deps.scheduleTaskRepository.findBySourceEntity(
      SourceModule.Reminder,
      templateId,
      identityId,
    );

    if (existingTasks.length > 0) {
      logger.info('[Reminder->Schedule] Removing existing schedule tasks before rebuild', {
        templateId,
        taskIds: existingTasks.map((task) => task.id),
      });
      await deps.scheduleTaskRepository.deleteBatch(existingTasks.map((task) => task.id));
      for (const task of existingTasks) {
        eventBus.send('schedule:task-deleted', { taskId: task.id });
      }
    }

    const template = await deps.reminderTemplateRepository.findById(templateId, {
      includeHistory: true,
    });
    if (!template || template.deletedAt || !template.isEffectivelyEnabled() || !template.nextTriggerAt) {
      logger.warn('[Reminder->Schedule] Projection skipped because template is not schedulable', {
        templateId,
        exists: !!template,
        deletedAt: template?.deletedAt?.toISOString() ?? null,
        effectiveEnabled: template?.isEffectivelyEnabled() ?? null,
        nextTriggerAt: template?.nextTriggerAt ?? null,
      });
      return;
    }

    const scheduleTask = ScheduleTask.create({
      identityId: String(template.identityId),
      name: template.title,
      description: template.description ?? undefined,
      sourceModule: SourceModule.Reminder,
      sourceEntityId: template.id,
      schedule: ScheduleConfig.fromDTO({
        cronExpression: null,
        timezone: template.trigger.fixedTime?.timezone
          ? Timezone.of(template.trigger.fixedTime.timezone)
          : Timezone.Shanghai,
        startDate: new Date(template.nextTriggerAt).toISOString(),
        endDate: null,
        maxExecutions: template.type === ReminderType.OneTime ? 1 : null,
      }),
      metadata: ScheduleTaskMetadata.create({
        payload: {
          reminderId: template.id,
          reminderTitle: template.title,
        },
        tags: ['reminder'],
        priority: 'Normal',
        timeout: null,
      }),
    });

    await deps.scheduleTaskRepository.save(scheduleTask);
    logger.info('[Reminder->Schedule] Schedule task saved for reminder', {
      templateId,
      scheduleTaskId: scheduleTask.id,
      nextRunAt: scheduleTask.nextRunAt?.toISOString() ?? null,
      sourceModule: scheduleTask.sourceModule,
    });
  };

  const deleteReminderTask = async (templateId: string, identityId?: string) => {
    const existingTasks = await deps.scheduleTaskRepository.findBySourceEntity(
      SourceModule.Reminder,
      templateId,
      identityId,
    );
    if (existingTasks.length > 0) {
      await deps.scheduleTaskRepository.deleteBatch(existingTasks.map((task) => task.id));
      for (const task of existingTasks) {
        eventBus.send('schedule:task-deleted', { taskId: task.id });
      }
    }
  };

  const upsertFromEvent = async (
    event:
      | ReminderEventMap['reminder:template-created']
      | ReminderEventMap['reminder:template-updated']
      | ReminderEventMap['reminder:template-enabled']
      | ReminderEventMap['reminder:template-moved'],
  ) => {
    await syncReminderTask(event.templateId, String(event.identityId));
  };

  const deleteFromEvent = async (
    event:
      | ReminderEventMap['reminder:template-paused']
      | ReminderEventMap['reminder:template-deleted'],
  ) => {
    await deleteReminderTask(event.templateId, String(event.identityId));
  };

  let started = false;

  return {
    start(): void {
      if (started) {
        return;
      }

      eventBus.on('reminder:template-created', upsertFromEvent as (event: ReminderEventMap['reminder:template-created']) => void);
      eventBus.on('reminder:template-updated', upsertFromEvent as (event: ReminderEventMap['reminder:template-updated']) => void);
      eventBus.on('reminder:template-enabled', upsertFromEvent as (event: ReminderEventMap['reminder:template-enabled']) => void);
      eventBus.on('reminder:template-moved', upsertFromEvent as (event: ReminderEventMap['reminder:template-moved']) => void);
      eventBus.on('reminder:template-paused', deleteFromEvent as (event: ReminderEventMap['reminder:template-paused']) => void);
      eventBus.on('reminder:template-deleted', deleteFromEvent as (event: ReminderEventMap['reminder:template-deleted']) => void);

      started = true;
      logger.info('[Reminder] Schedule projection runtime started', {
        subscribedEvents: [
          'reminder:template-created',
          'reminder:template-updated',
          'reminder:template-enabled',
          'reminder:template-moved',
          'reminder:template-paused',
          'reminder:template-deleted',
        ],
      });
    },

    stop(): void {
      if (!started) {
        return;
      }

      eventBus.off('reminder:template-created', upsertFromEvent as (event: ReminderEventMap['reminder:template-created']) => void);
      eventBus.off('reminder:template-updated', upsertFromEvent as (event: ReminderEventMap['reminder:template-updated']) => void);
      eventBus.off('reminder:template-enabled', upsertFromEvent as (event: ReminderEventMap['reminder:template-enabled']) => void);
      eventBus.off('reminder:template-moved', upsertFromEvent as (event: ReminderEventMap['reminder:template-moved']) => void);
      eventBus.off('reminder:template-paused', deleteFromEvent as (event: ReminderEventMap['reminder:template-paused']) => void);
      eventBus.off('reminder:template-deleted', deleteFromEvent as (event: ReminderEventMap['reminder:template-deleted']) => void);

      started = false;
      logger.info('[Reminder] Schedule projection runtime stopped');
    },
  };
}
