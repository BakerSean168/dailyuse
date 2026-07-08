import { ReminderType, type ReminderEventMap } from '@dailyuse/contracts/reminder';
import { SourceModule, Timezone } from '@dailyuse/contracts/schedule';
import { ScheduleTask } from '@dailyuse/schedule';
import type { IReminderTemplateRepository } from '../domain/repositories/i-reminder-template-repository';

export interface ReminderScheduleProjectionSelection {
  readonly sourceModule: SourceModule;
  readonly identityId?: string;
  readonly sourceEntityId?: string;
  matches(task: ScheduleTask): boolean;
}

export interface ReminderScheduleProjectionPlan {
  readonly selection: ReminderScheduleProjectionSelection;
  readonly nextTasks: readonly ScheduleTask[];
}

export interface ReminderScheduleProjectionSource {
  buildTemplatePlan(
    templateId: string,
    identityId?: string,
  ): Promise<ReminderScheduleProjectionPlan>;
  buildTemplateDeletionSelection(
    templateId: string,
    identityId?: string,
  ): ReminderScheduleProjectionSelection;
}

export interface ReminderScheduleProjectionHandlers {
  upsertTemplate(templateId: string, identityId?: string): Promise<void>;
  deleteTemplate(templateId: string, identityId?: string): Promise<void>;
}

export type ReminderScheduleProjectionEventMap = Pick<
  ReminderEventMap,
  | 'reminder:template-created'
  | 'reminder:template-updated'
  | 'reminder:template-enabled'
  | 'reminder:template-moved'
  | 'reminder:template-paused'
  | 'reminder:template-deleted'
>;

function selectReminderProjection(
  templateId: string,
  identityId?: string,
): ReminderScheduleProjectionSelection {
  return {
    sourceModule: SourceModule.Reminder,
    sourceEntityId: templateId,
    identityId,
    matches(task) {
      return task.sourceEntityId === templateId;
    },
  };
}

export function createReminderScheduleProjectionSource(deps: {
  reminderTemplateRepository: IReminderTemplateRepository;
}): ReminderScheduleProjectionSource {
  return {
    async buildTemplatePlan(templateId, identityId) {
      const template = await deps.reminderTemplateRepository.findById(templateId, {
        includeHistory: true,
      });

      if (!template) {
        return {
          selection: selectReminderProjection(templateId, identityId),
          nextTasks: [],
        };
      }

      const selection = selectReminderProjection(templateId, String(template.identityId));
      if (!template || template.deletedAt || !template.isEffectivelyEnabled() || !template.nextTriggerAt) {
        return {
          selection,
          nextTasks: [],
        };
      }

      const fixedTimezone = template.trigger.fixedTime?.timezone;
      const scheduleTimezone =
        fixedTimezone && Object.values(Timezone).includes(fixedTimezone as (typeof Timezone)[keyof typeof Timezone])
          ? (fixedTimezone as (typeof Timezone)[keyof typeof Timezone])
          : Timezone.Shanghai;

      const scheduleTask = ScheduleTask.create({
        identityId: String(template.identityId),
        name: template.title,
        description: template.description ?? undefined,
        sourceModule: SourceModule.Reminder,
        sourceEntityId: template.id,
        schedule: {
          cronExpression: null,
          timezone: scheduleTimezone,
          startDate: new Date(template.nextTriggerAt).toISOString(),
          endDate: null,
          maxExecutions: template.type === ReminderType.OneTime ? 1 : null,
        },
        metadata: {
          payload: {
            reminderId: template.id,
            reminderTitle: template.title,
          },
          tags: ['reminder'],
          priority: 'Normal',
          timeout: null,
        },
      });

      return {
        selection,
        nextTasks: [scheduleTask],
      };
    },

    buildTemplateDeletionSelection(templateId, identityId) {
      return selectReminderProjection(templateId, identityId);
    },
  };
}

export function createReminderScheduleProjectionEventHandlers(
  handlers: ReminderScheduleProjectionHandlers,
): {
  [K in keyof ReminderScheduleProjectionEventMap]: (
    event: ReminderScheduleProjectionEventMap[K],
  ) => Promise<void>;
} {
  return {
    'reminder:template-created': async (event) =>
      handlers.upsertTemplate(event.templateId, String(event.identityId)),
    'reminder:template-updated': async (event) =>
      handlers.upsertTemplate(event.templateId, String(event.identityId)),
    'reminder:template-enabled': async (event) =>
      handlers.upsertTemplate(event.templateId, String(event.identityId)),
    'reminder:template-moved': async (event) =>
      handlers.upsertTemplate(event.templateId, String(event.identityId)),
    'reminder:template-paused': async (event) =>
      handlers.deleteTemplate(event.templateId, String(event.identityId)),
    'reminder:template-deleted': async (event) =>
      handlers.deleteTemplate(event.templateId, String(event.identityId)),
  };
}
