import { createLogger } from '@dailyuse/utils';
import type { ReminderTemplateServerDTO, ReminderGroupServerDTO } from '@dailyuse/contracts/reminder';
import { SourceModule } from '@dailyuse/contracts/schedule';
import { ScheduleTaskFactory, ScheduleContainer } from '@dailyuse/schedule';
import { ReminderContainer } from '@/infrastructure-server/di/reminder-container';
import type {
  ReminderBusEvent,
  ReminderGroupAction,
  ReminderGroupRefreshPayload,
  ReminderTemplateAction,
  ReminderTemplateRefreshPayload,
} from './types';

type SSEManager = {
  sendMessage(identityId: string, eventName: string, data: unknown): boolean;
};

const logger = createLogger('ReminderHandlerSupport');

export class ReminderHandlerSupport {
  constructor(private readonly sseManager: SSEManager) {}

  async emitTemplateRefresh<TPayload>(
    event: ReminderBusEvent<TPayload>,
    action: ReminderTemplateAction,
    options?: { includePayloadSnapshot?: boolean; skipSnapshot?: boolean },
  ): Promise<void> {
    if (!event.identityId) {
      logger.warn('[ReminderHandlerSupport] Missing identityId for template refresh', {
        action,
        aggregateId: event.aggregateId,
      });
      return;
    }

    const payloadObject = this.asRecord(event.payload);
    const payload: ReminderTemplateRefreshPayload = {
      templateId: event.aggregateId,
      reason: action,
      action,
      timestamp: Date.now(),
      payload: payloadObject,
    };

    if (!options?.skipSnapshot) {
      let templateSnapshot: ReminderTemplateServerDTO | undefined;
      if (options?.includePayloadSnapshot) {
        templateSnapshot =
          (payloadObject?.reminder as ReminderTemplateServerDTO | undefined) ??
          (payloadObject?.reminderData as ReminderTemplateServerDTO | undefined);
      }
      if (!templateSnapshot) {
        templateSnapshot = await this.fetchTemplateSnapshot(event.aggregateId);
      }
      if (templateSnapshot) {
        payload.template = templateSnapshot;
      }
    }

    await this.emitSse(event.identityId, 'reminder:template:refresh', payload);
  }

  async emitGroupRefresh<TPayload>(
    event: ReminderBusEvent<TPayload>,
    action: ReminderGroupAction,
    options?: { skipSnapshot?: boolean },
  ): Promise<void> {
    if (!event.identityId) {
      logger.warn('[ReminderHandlerSupport] Missing identityId for group refresh', {
        action,
        aggregateId: event.aggregateId,
      });
      return;
    }

    const payloadObject = this.asRecord(event.payload);
    const payload: ReminderGroupRefreshPayload = {
      groupId: event.aggregateId,
      reason: action,
      action,
      timestamp: Date.now(),
      payload: payloadObject,
    };

    if (!options?.skipSnapshot) {
      const groupSnapshot = await this.fetchGroupSnapshot(event.aggregateId);
      if (groupSnapshot) {
        payload.group = groupSnapshot;
      }
    }

    await this.emitSse(event.identityId, 'reminder:group:refresh', payload);
  }

  async createScheduleTaskForReminder<TPayload>(event: ReminderBusEvent<TPayload>): Promise<void> {
    if (!event.identityId) {
      logger.warn('[ReminderHandlerSupport] Missing identityId when creating ScheduleTask', {
        aggregateId: event.aggregateId,
      });
      return;
    }

    const payloadObject = this.asRecord(event.payload);
    const reminder =
      (payloadObject?.reminder as ReminderTemplateServerDTO | undefined) ??
      (payloadObject?.reminderData as ReminderTemplateServerDTO | undefined) ??
      (await this.fetchTemplateSnapshot(event.aggregateId));

    if (!reminder) {
      logger.warn('[ReminderHandlerSupport] Reminder snapshot not found for schedule creation', {
        aggregateId: event.aggregateId,
      });
      return;
    }

    try {
      const factory = new ScheduleTaskFactory();
      const scheduleTask = factory.createFromSourceEntity({
        identityId: event.identityId,
        sourceModule: SourceModule.Reminder,
        sourceEntityId: reminder.id,
        sourceEntity: reminder,
      });

      const repository = ScheduleContainer.getInstance().getScheduleTaskRepository();
      await repository.save(scheduleTask);

      logger.info('[ReminderHandlerSupport] ScheduleTask created for reminder', {
        reminderId: reminder.id,
        scheduleTaskId: scheduleTask.id,
      });
    } catch (error: unknown) {
      const maybeError = error as { name?: string; message?: string };
      if (maybeError?.name === 'SourceEntityNoScheduleRequiredError') {
        logger.info('[ReminderHandlerSupport] Reminder does not require schedule task', {
          reminderId: reminder.id,
        });
        return;
      }

      logger.error('[ReminderHandlerSupport] Failed to create ScheduleTask', {
        reminderId: reminder.id,
        error: maybeError?.message ?? String(error),
      });
    }
  }

  async enableScheduleTaskForReminder(reminderId: string): Promise<void> {
    await this.updateScheduleTaskState(reminderId, 'enable');
  }

  async pauseScheduleTaskForReminder(reminderId: string): Promise<void> {
    await this.updateScheduleTaskState(reminderId, 'pause');
  }

  async deleteScheduleTaskForReminder(reminderId: string): Promise<void> {
    const repository = ScheduleContainer.getInstance().getScheduleTaskRepository();
    const tasks = await repository.findBySourceEntity(SourceModule.Reminder, reminderId);
    if (tasks.length === 0) {
      logger.warn('[ReminderHandlerSupport] No ScheduleTask found for delete', { reminderId });
      return;
    }

    for (const task of tasks) {
      await repository.deleteById(task.id);
    }

    logger.info('[ReminderHandlerSupport] ScheduleTask deleted for reminder', {
      reminderId,
      deletedCount: tasks.length,
    });
  }

  private async updateScheduleTaskState(
    reminderId: string,
    action: 'enable' | 'pause',
  ): Promise<void> {
    const repository = ScheduleContainer.getInstance().getScheduleTaskRepository();
    const tasks = await repository.findBySourceEntity(SourceModule.Reminder, reminderId);

    if (tasks.length === 0) {
      logger.warn('[ReminderHandlerSupport] No ScheduleTask found for state update', {
        reminderId,
        action,
      });
      return;
    }

    for (const task of tasks) {
      if (action === 'enable') {
        task.enable();
      } else {
        task.disable();
      }
      await repository.save(task);
    }

    logger.info('[ReminderHandlerSupport] ScheduleTask state updated', {
      reminderId,
      action,
      updatedCount: tasks.length,
    });
  }

  private async fetchTemplateSnapshot(id: string): Promise<ReminderTemplateServerDTO | undefined> {
    try {
      const repo = ReminderContainer.getInstance().getReminderTemplateRepository();
      const template = await repo.findById(id);
      return template?.toServerDTO();
    } catch (error) {
      logger.error('[ReminderHandlerSupport] Failed to fetch template snapshot', { id, error });
      return undefined;
    }
  }

  private async fetchGroupSnapshot(id: string): Promise<ReminderGroupServerDTO | undefined> {
    try {
      const repo = ReminderContainer.getInstance().getReminderGroupRepository();
      const group = await repo.findById(id);
      return group?.toServerDTO();
    } catch (error) {
      logger.error('[ReminderHandlerSupport] Failed to fetch group snapshot', { id, error });
      return undefined;
    }
  }

  private async emitSse(identityId: string, eventName: string, data: unknown): Promise<void> {
    try {
      const sent = this.sseManager.sendMessage(identityId, eventName, data);
      if (!sent) {
        logger.warn('[ReminderHandlerSupport] SSE message not delivered', {
          identityId,
          eventName,
        });
      }
    } catch (error) {
      logger.error('[ReminderHandlerSupport] Failed to emit SSE message', {
        identityId,
        eventName,
        error,
      });
    }
  }

  private asRecord(payload: unknown): Record<string, unknown> | undefined {
    return typeof payload === 'object' && payload !== null
      ? (payload as Record<string, unknown>)
      : undefined;
  }
}
