import { createLogger } from '@dailyuse/utils';
import type {
  ReminderTemplateServerDTO,
  ReminderGroupServerDTO,
} from '@dailyuse/contracts/reminder';
import { SourceModule } from '@dailyuse/contracts/schedule';
import { ScheduleTaskFactory } from '@dailyuse/schedule';
import type { IScheduleTaskRepository } from '@dailyuse/schedule/domain-server';
import type { IReminderTemplateRepository } from '../../domain-server/repositories/IReminderTemplateRepository';
import type { IReminderGroupRepository } from '../../domain-server/repositories/IReminderGroupRepository';
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

/**
 * Event handler support — provides SSE emission and snapshot enrichment.
 * 事件处理支持 —— 提供 SSE 推送和快照填充能力。
 *
 * Dependencies are now injected via constructor instead of the legacy ReminderContainer.
 * 依赖现在通过构造函数注入，而非旧版 ReminderContainer。
 */
export class ReminderHandlerSupport {
  constructor(
    private readonly sseManager: SSEManager,
    private readonly reminderTemplateRepository: IReminderTemplateRepository,
    private readonly reminderGroupRepository: IReminderGroupRepository,
    private readonly scheduleTaskRepository?: IScheduleTaskRepository,
  ) {}

  async emitTemplateRefresh<TPayload>(
    event: ReminderBusEvent<TPayload>,
    action: ReminderTemplateAction,
    options?: { includePayloadSnapshot?: boolean; skipSnapshot?: boolean },
  ): Promise<void> {
    const identityId = this.getIdentityId(event);
    const templateId = this.getTemplateId(event);
    if (!identityId) {
      logger.warn('[ReminderHandlerSupport] Missing identityId for template refresh', {
        action,
        aggregateId: templateId,
      });
      return;
    }
    if (!templateId) {
      logger.warn('[ReminderHandlerSupport] Missing templateId for template refresh', { action });
      return;
    }

    const payloadObject = this.getPayloadObject(event);
    const payload: ReminderTemplateRefreshPayload = {
      templateId,
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
        templateSnapshot = await this.fetchTemplateSnapshot(templateId);
      }
      if (templateSnapshot) {
        payload.template = templateSnapshot;
      }
    }

    await this.emitSse(identityId, 'reminder:template:refresh', payload);
  }

  async emitGroupRefresh<TPayload>(
    event: ReminderBusEvent<TPayload>,
    action: ReminderGroupAction,
    options?: { skipSnapshot?: boolean },
  ): Promise<void> {
    const identityId = this.getIdentityId(event);
    const groupId = this.getGroupId(event);
    if (!identityId) {
      logger.warn('[ReminderHandlerSupport] Missing identityId for group refresh', {
        action,
        aggregateId: groupId,
      });
      return;
    }
    if (!groupId) {
      logger.warn('[ReminderHandlerSupport] Missing groupId for group refresh', { action });
      return;
    }

    const payloadObject = this.getPayloadObject(event);
    const payload: ReminderGroupRefreshPayload = {
      groupId,
      reason: action,
      action,
      timestamp: Date.now(),
      payload: payloadObject,
    };

    if (!options?.skipSnapshot) {
      const groupSnapshot = await this.fetchGroupSnapshot(groupId);
      if (groupSnapshot) {
        payload.group = groupSnapshot;
      }
    }

    await this.emitSse(identityId, 'reminder:group:refresh', payload);
  }

  async createScheduleTaskForReminder<TPayload>(event: ReminderBusEvent<TPayload>): Promise<void> {
    const identityId = this.getIdentityId(event);
    const templateId = this.getTemplateId(event);
    if (!identityId) {
      logger.warn('[ReminderHandlerSupport] Missing identityId when creating ScheduleTask', {
        aggregateId: templateId,
      });
      return;
    }
    if (!templateId) {
      logger.warn('[ReminderHandlerSupport] Missing templateId when creating ScheduleTask');
      return;
    }

    const payloadObject = this.getPayloadObject(event);
    const reminder =
      (payloadObject?.reminder as ReminderTemplateServerDTO | undefined) ??
      (payloadObject?.reminderData as ReminderTemplateServerDTO | undefined) ??
      (await this.fetchTemplateSnapshot(templateId));

    if (!reminder) {
      logger.warn('[ReminderHandlerSupport] Reminder snapshot not found for schedule creation', {
        aggregateId: templateId,
      });
      return;
    }

    try {
      if (!this.scheduleTaskRepository) {
        logger.warn('[ReminderHandlerSupport] ScheduleTaskRepository not configured');
        return;
      }

      const factory = new ScheduleTaskFactory();
      const scheduleTask = factory.createFromSourceEntity({
        identityId,
        sourceModule: SourceModule.Reminder,
        sourceEntityId: reminder.id,
        sourceEntity: reminder,
      });

      await this.scheduleTaskRepository.save(scheduleTask);

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

  resolveTemplateId<TPayload>(event: ReminderBusEvent<TPayload>): string | undefined {
    return this.getTemplateId(event);
  }

  resolveGroupId<TPayload>(event: ReminderBusEvent<TPayload>): string | undefined {
    return this.getGroupId(event);
  }

  async enableScheduleTaskForReminder(reminderId: string): Promise<void> {
    await this.updateScheduleTaskState(reminderId, 'enable');
  }

  async pauseScheduleTaskForReminder(reminderId: string): Promise<void> {
    await this.updateScheduleTaskState(reminderId, 'pause');
  }

  async deleteScheduleTaskForReminder(reminderId: string): Promise<void> {
    if (!this.scheduleTaskRepository) {
      logger.warn('[ReminderHandlerSupport] ScheduleTaskRepository not configured', { reminderId });
      return;
    }

    const tasks = await this.scheduleTaskRepository.findBySourceEntity(
      SourceModule.Reminder,
      reminderId,
    );
    if (tasks.length === 0) {
      logger.warn('[ReminderHandlerSupport] No ScheduleTask found for delete', { reminderId });
      return;
    }

    for (const task of tasks) {
      await this.scheduleTaskRepository.deleteById(task.id);
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
    if (!this.scheduleTaskRepository) {
      logger.warn('[ReminderHandlerSupport] ScheduleTaskRepository not configured', {
        reminderId,
        action,
      });
      return;
    }

    const tasks = await this.scheduleTaskRepository.findBySourceEntity(
      SourceModule.Reminder,
      reminderId,
    );

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
      await this.scheduleTaskRepository.save(task);
    }

    logger.info('[ReminderHandlerSupport] ScheduleTask state updated', {
      reminderId,
      action,
      updatedCount: tasks.length,
    });
  }

  private async fetchTemplateSnapshot(id: string): Promise<ReminderTemplateServerDTO | undefined> {
    try {
      const template = await this.reminderTemplateRepository.findById(id);
      return template?.toServerDTO();
    } catch (error) {
      logger.error('[ReminderHandlerSupport] Failed to fetch template snapshot', { id, error });
      return undefined;
    }
  }

  private async fetchGroupSnapshot(id: string): Promise<ReminderGroupServerDTO | undefined> {
    try {
      const group = await this.reminderGroupRepository.findById(id);
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

  private getPayloadObject<TPayload>(
    event: ReminderBusEvent<TPayload>,
  ): Record<string, unknown> | undefined {
    return this.asRecord((event as any)?.payload ?? event);
  }

  private getIdentityId<TPayload>(event: ReminderBusEvent<TPayload>): string | undefined {
    const payloadObject = this.getPayloadObject(event);
    return event.identityId ?? (payloadObject?.identityId as string | undefined);
  }

  private getTemplateId<TPayload>(event: ReminderBusEvent<TPayload>): string | undefined {
    const payloadObject = this.getPayloadObject(event);
    return (
      event.aggregateId ??
      (payloadObject?.templateId as string | undefined) ??
      (payloadObject?.reminderId as string | undefined) ??
      ((payloadObject?.reminder as ReminderTemplateServerDTO | undefined)?.id as string | undefined)
    );
  }

  private getGroupId<TPayload>(event: ReminderBusEvent<TPayload>): string | undefined {
    const payloadObject = this.getPayloadObject(event);
    return (
      event.aggregateId ??
      (payloadObject?.groupId as string | undefined) ??
      ((payloadObject?.group as ReminderGroupServerDTO | undefined)?.id as string | undefined)
    );
  }
}
