import { eventBus, type DomainEvent, Logger } from '@dailyuse/utils';
import type {
  ReminderTemplateServerDTO,
  ReminderGroupServerDTO,
} from '@dailyuse/contracts/reminder';

const logger = new Logger('ReminderEventHandler');

type ReminderTemplateAction =
  | 'template-created'
  | 'template-updated'
  | 'template-enabled'
  | 'template-paused'
  | 'template-deleted'
  | 'template-moved';

type ReminderGroupAction =
  | 'group-created'
  | 'group-updated'
  | 'group-enabled'
  | 'group-paused'
  | 'group-control-mode-changed'
  | 'group-deleted';

type ReminderTemplateRefreshPayload = {
  templateId: string;
  reason: ReminderTemplateAction;
  action: ReminderTemplateAction;
  timestamp: number;
  payload?: Record<string, unknown>;
  template?: ReminderTemplateServerDTO;
};

type ReminderGroupRefreshPayload = {
  groupId: string;
  reason: ReminderGroupAction;
  action: ReminderGroupAction;
  timestamp: number;
  payload?: Record<string, unknown>;
  group?: ReminderGroupServerDTO;
};

type SSEManager = import('../../../notification/interface/sseRoutes').SSEConnectionManager;

export class ReminderEventHandler {
  private static isInitialized = false;
  private static sseManager: SSEManager | null = null;

  static async initialize(sseManager: SSEManager): Promise<void> {
    if (this.isInitialized) {
      console.log('⚠️ [ReminderEventHandler] Already initialized, skipping');
      return;
    }

    this.sseManager = sseManager;
    this.isInitialized = true;
    console.log('🎧 [ReminderEventHandler] Initializing reminder event listeners...');

    eventBus.on('reminder.template.created', async (event: DomainEvent) => {
      await this.handleTemplateEvent(event, 'template-created', {
        includeSnapshotFromEvent: true,
      });

      // 🔥 创建 ScheduleTask
      await this.createScheduleTaskForReminder(event);
    });

    eventBus.on('reminder.template.updated', async (event: DomainEvent) => {
      await this.handleTemplateEvent(event, 'template-updated');
    });

    eventBus.on('reminder.template.enabled', async (event: DomainEvent) => {
      await this.handleTemplateEvent(event, 'template-enabled');

      // 🔥 启用对应的 ScheduleTask
      await this.enableScheduleTaskForReminder(event);
    });

    eventBus.on('reminder.template.paused', async (event: DomainEvent) => {
      await this.handleTemplateEvent(event, 'template-paused');

      // 🔥 暂停对应的 ScheduleTask
      await this.disableScheduleTaskForReminder(event);
    });

    eventBus.on('reminder.template.deleted', async (event: DomainEvent) => {
      await this.handleTemplateEvent(event, 'template-deleted', {
        skipSnapshot: true,
      });

      // 🔥 删除对应的 ScheduleTask
      await this.deleteScheduleTaskForReminder(event);
    });

    eventBus.on('reminder.template.moved', async (event: DomainEvent) => {
      await this.handleTemplateEvent(event, 'template-moved');
    });

    eventBus.on('ReminderGroupCreated', async (event: DomainEvent) => {
      await this.handleGroupEvent(event, 'group-created');
    });

    eventBus.on('ReminderGroupEnabled', async (event: DomainEvent) => {
      await this.handleGroupEvent(event, 'group-enabled');
    });

    eventBus.on('ReminderGroupPaused', async (event: DomainEvent) => {
      await this.handleGroupEvent(event, 'group-paused');
    });

    eventBus.on('ReminderGroupControlModeSwitched', async (event: DomainEvent) => {
      await this.handleGroupEvent(event, 'group-control-mode-changed');
    });

    eventBus.on('ReminderGroupDeleted', async (event: DomainEvent) => {
      await this.handleGroupEvent(event, 'group-deleted', { skipSnapshot: true });
    });

    this.isInitialized = true;
    console.log('✅ [ReminderEventHandler] Reminder event listeners initialized');
  }

  private static async handleTemplateEvent(
    event: DomainEvent,
    action: ReminderTemplateAction,
    options?: { includeSnapshotFromEvent?: boolean; skipSnapshot?: boolean },
  ): Promise<void> {
    if (!event.identityId) {
      logger.warn(`[ReminderEventHandler] Missing identityId for ${action}`, {
        eventType: event.eventType,
        aggregateId: event.aggregateId,
      });
      return;
    }

    const rawPayload =
      typeof event.payload === 'object' && event.payload !== null
        ? (event.payload as Record<string, unknown>)
        : undefined;

    const payload: ReminderTemplateRefreshPayload = {
      templateId: event.aggregateId,
      reason: action,
      action,
      timestamp: Date.now(),
      payload: rawPayload,
    };

    if (!options?.skipSnapshot) {
      let templateSnapshot: ReminderTemplateServerDTO | undefined;

      if (options?.includeSnapshotFromEvent) {
        templateSnapshot = rawPayload?.reminder as ReminderTemplateServerDTO | undefined;
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

  private static async handleGroupEvent(
    event: DomainEvent,
    action: ReminderGroupAction,
    options?: { skipSnapshot?: boolean },
  ): Promise<void> {
    if (!event.identityId) {
      logger.warn(`[ReminderEventHandler] Missing identityId for ${action}`, {
        eventType: event.eventType,
        aggregateId: event.aggregateId,
      });
      return;
    }

    const rawPayload =
      typeof event.payload === 'object' && event.payload !== null
        ? (event.payload as Record<string, unknown>)
        : undefined;

    const payload: ReminderGroupRefreshPayload = {
      groupId: event.aggregateId,
      reason: action,
      action,
      timestamp: Date.now(),
      payload: rawPayload,
    };

    if (!options?.skipSnapshot) {
      const groupSnapshot = await this.fetchGroupSnapshot(event.aggregateId);
      if (groupSnapshot) {
        payload.group = groupSnapshot;
      }
    }

    await this.emitSse(event.identityId, 'reminder:group:refresh', payload);
  }

  private static async fetchTemplateSnapshot(
    id: string,
  ): Promise<ReminderTemplateServerDTO | undefined> {
    try {
      const repo = ReminderContainer.getInstance().getReminderTemplateRepository() as any;
      const template =
        typeof repo.findById === 'function'
          ? await repo.findById(id)
          : await repo.findById(id);
      return template?.toServerDTO();
    } catch (error) {
      logger.error('[ReminderEventHandler] Failed to fetch template snapshot', { id, error });
      return undefined;
    }
  }

  private static async fetchGroupSnapshot(
    id: string,
  ): Promise<ReminderGroupServerDTO | undefined> {
    try {
      const repo = ReminderContainer.getInstance().getReminderGroupRepository() as any;
      let group = null;

      if (typeof repo.findById === 'function') {
        group = await repo.findById(id);
      } else if (typeof repo.findById === 'function') {
        group = await repo.findById(id);
      }

      return group?.toServerDTO();
    } catch (error) {
      logger.error('[ReminderEventHandler] Failed to fetch group snapshot', { id, error });
      return undefined;
    }
  }

  private static async emitSse(identityId: string, eventName: string, data: any): Promise<void> {
    try {
      const sseManager = await this.getSseManager();
      const sent = sseManager.sendMessage(identityId, eventName, data);

      if (!sent) {
        logger.warn('[ReminderEventHandler] SSE message not delivered (no active connection)', {
          identityId,
          eventName,
        });
      }
    } catch (error) {
      logger.error('[ReminderEventHandler] Failed to emit SSE message', {
        identityId,
        eventName,
        error,
      });
    }
  }

  private static async getSseManager(): Promise<SSEManager> {
    if (!this.sseManager) {
      throw new Error('ReminderEventHandler not initialized. Call initialize() first.');
    }
    return this.sseManager;
  }

  /**
   * 为 ReminderTemplate 创建 ScheduleTask
   */
  private static async createScheduleTaskForReminder(event: DomainEvent): Promise<void> {
    const { identityId, payload } = event as any;

    if (!identityId) {
      logger.error('[ReminderEventHandler] Missing identityId in reminder.template.created event');
      return;
    }

    const rawPayload =
      typeof payload === 'object' && payload !== null
        ? (payload as Record<string, unknown>)
        : undefined;

    const reminder = rawPayload?.reminder as ReminderTemplateServerDTO | undefined;

    if (!reminder) {
      logger.error('[ReminderEventHandler] Missing reminder in event payload');
      return;
    }

    logger.info('📝 [ReminderEventHandler] Creating ScheduleTask for reminder', {
      identityId,
      reminderId: reminder.id,
      reminderTitle: reminder.title,
      selfEnabled: reminder.selfEnabled,
      status: reminder.status,
    });

    try {
      const { ScheduleTaskFactory } = await import('@dailyuse/schedule/application-server');
      const { SourceModule } = await import('@dailyuse/contracts/schedule');
      const { ScheduleContainer } =
        await import('../../../schedule/infrastructure/di/ScheduleContainer');

      // 创建 ScheduleTaskFactory
      const factory = new ScheduleTaskFactory();

      // 使用 ReminderScheduleStrategy 创建 ScheduleTask
      const scheduleTask = factory.createFromSourceEntity({
        identityId,
        sourceModule: SourceModule.REMINDER,
        sourceEntityId: reminder.id,
        sourceEntity: reminder, // 使用 ServerDTO
      });

      // 保存到仓储
      const container = ScheduleContainer.getInstance();
      const repository = container.getScheduleTaskRepository();
      await repository.save(scheduleTask);

      logger.info(`✅ [ReminderEventHandler] 为提醒 "${reminder.title}" 创建了 ScheduleTask`, {
        scheduleTaskId: scheduleTask.id,
        reminderId: reminder.id,
        identityId,
      });
    } catch (error: any) {
      // 如果是"不需要调度"错误，不报错
      if (error?.name === 'SourceEntityNoScheduleRequiredError') {
        logger.info(
          `ℹ️  [ReminderEventHandler] 提醒 "${reminder.title}" 不需要创建 ScheduleTask（未启用或不满足条件）`,
        );
        return;
      }

      logger.error(`❌ [ReminderEventHandler] 为提醒 "${reminder.title}" 创建 ScheduleTask 失败`, {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        reminderId: reminder.id,
        identityId,
      });
      // 不抛出错误，ScheduleTask 创建失败不影响 ReminderTemplate 创建
    }
  }

  /**
   * 启用 Reminder 对应的 ScheduleTask
   */
  private static async enableScheduleTaskForReminder(event: DomainEvent): Promise<void> {
    const reminderId = event.aggregateId;

    try {
      const { ScheduleContainer } =
        await import('../../../schedule/infrastructure/di/ScheduleContainer');
      const { SourceModule } = await import('@dailyuse/contracts/schedule');

      const container = ScheduleContainer.getInstance();
      const repository = container.getScheduleTaskRepository();

      // 查找该 reminder 对应的 ScheduleTask（返回数组）
      const scheduleTasks = await repository.findBySourceEntity(
        SourceModule.REMINDER,
        reminderId,
      );

      if (scheduleTasks && scheduleTasks.length > 0) {
        for (const scheduleTask of scheduleTasks) {
          scheduleTask.enable();
          await repository.save(scheduleTask);

          logger.info('✅ [ReminderEventHandler] 启用了 ScheduleTask', {
            reminderId,
            scheduleTaskId: scheduleTask.id,
          });
        }
      } else {
        logger.warn('⚠️ [ReminderEventHandler] 未找到对应的 ScheduleTask', {
          reminderId,
        });
      }
    } catch (error) {
      logger.error('❌ [ReminderEventHandler] 启用 ScheduleTask 失败', {
        error: error instanceof Error ? error.message : String(error),
        reminderId,
      });
    }
  }

  /**
   * 暂停 Reminder 对应的 ScheduleTask
   */
  private static async disableScheduleTaskForReminder(event: DomainEvent): Promise<void> {
    const reminderId = event.aggregateId;

    try {
      const { ScheduleContainer } =
        await import('../../../schedule/infrastructure/di/ScheduleContainer');
      const { SourceModule } = await import('@dailyuse/contracts/schedule');

      const container = ScheduleContainer.getInstance();
      const repository = container.getScheduleTaskRepository();

      // 查找该 reminder 对应的 ScheduleTask（返回数组）
      const scheduleTasks = await repository.findBySourceEntity(
        SourceModule.REMINDER,
        reminderId,
      );

      if (scheduleTasks && scheduleTasks.length > 0) {
        for (const scheduleTask of scheduleTasks) {
          scheduleTask.disable();
          await repository.save(scheduleTask);

          logger.info('✅ [ReminderEventHandler] 暂停了 ScheduleTask', {
            reminderId,
            scheduleTaskId: scheduleTask.id,
          });
        }
      } else {
        logger.warn('⚠️ [ReminderEventHandler] 未找到对应的 ScheduleTask', {
          reminderId,
        });
      }
    } catch (error) {
      logger.error('❌ [ReminderEventHandler] 暂停 ScheduleTask 失败', {
        error: error instanceof Error ? error.message : String(error),
        reminderId,
      });
    }
  }

  /**
   * 删除 Reminder 对应的 ScheduleTask
   */
  private static async deleteScheduleTaskForReminder(event: DomainEvent): Promise<void> {
    const reminderId = event.aggregateId;

    try {
      const { ScheduleContainer } =
        await import('../../../schedule/infrastructure/di/ScheduleContainer');
      const { SourceModule } = await import('@dailyuse/contracts/schedule');

      const container = ScheduleContainer.getInstance();
      const repository = container.getScheduleTaskRepository();

      // 查找该 reminder 对应的 ScheduleTask（返回数组）
      const scheduleTasks = await repository.findBySourceEntity(
        SourceModule.REMINDER,
        reminderId,
      );

      if (scheduleTasks && scheduleTasks.length > 0) {
        for (const scheduleTask of scheduleTasks) {
          await repository.deleteById(scheduleTask.id);

          logger.info('✅ [ReminderEventHandler] 删除了 ScheduleTask', {
            reminderId,
            scheduleTaskId: scheduleTask.id,
          });
        }
      } else {
        logger.warn('⚠️ [ReminderEventHandler] 未找到对应的 ScheduleTask', {
          reminderId,
        });
      }
    } catch (error) {
      logger.error('❌ [ReminderEventHandler] 删除 ScheduleTask 失败', {
        error: error instanceof Error ? error.message : String(error),
        reminderId,
      });
    }
  }
}
