/**
 * Reminder Event Handler
 *
 * 事件注册器：按用例委派到独立 handler
 * - ReminderTemplate Created/Updated/Enabled/Paused/Deleted/Moved
 * - ReminderGroup Created/Updated/Enabled/Paused/ControlModeSwitched/Deleted
 *
 * Dependencies are now injected explicitly instead of relying on the legacy container.
 * 依赖现在通过显式注入，而非依赖旧版容器。
 */

import { createLogger, eventBus } from '@dailyuse/utils';
import type { IScheduleTaskRepository } from '@dailyuse/schedule/domain-server';
import type { IReminderTemplateRepository } from '../../domain-server/repositories/IReminderTemplateRepository';
import type { IReminderGroupRepository } from '../../domain-server/repositories/IReminderGroupRepository';
import {
  ReminderHandlerSupport,
  ReminderTemplateCreatedHandler,
  ReminderTemplateUpdatedHandler,
  ReminderTemplateEnabledHandler,
  ReminderTemplatePausedHandler,
  ReminderTemplateDeletedHandler,
  ReminderTemplateMovedHandler,
  ReminderGroupCreatedHandler,
  ReminderGroupUpdatedHandler,
  ReminderGroupEnabledHandler,
  ReminderGroupPausedHandler,
  ReminderGroupControlModeSwitchedHandler,
  ReminderGroupDeletedHandler,
  type ReminderBusEvent,
  type ReminderTemplateCreatedPayload,
  type ReminderTemplateUpdatedPayload,
  type ReminderTemplateEnabledPayload,
  type ReminderTemplatePausedPayload,
  type ReminderTemplateDeletedPayload,
  type ReminderTemplateMovedPayload,
  type ReminderGroupCreatedPayload,
  type ReminderGroupUpdatedPayload,
  type ReminderGroupEnabledPayload,
  type ReminderGroupPausedPayload,
  type ReminderGroupControlModeSwitchedPayload,
  type ReminderGroupDeletedPayload,
} from '@/application-server/handlers';

const logger = createLogger('ReminderEventHandler');

type SSEManager = {
  sendMessage(identityId: string, eventName: string, data: unknown): boolean;
};

export interface ReminderEventHandlerDependencies {
  readonly sseManager: SSEManager;
  readonly reminderTemplateRepository: IReminderTemplateRepository;
  readonly reminderGroupRepository: IReminderGroupRepository;
  readonly scheduleTaskRepository?: IScheduleTaskRepository;
}

export class ReminderEventHandler {
  private static isInitialized = false;

  static async initialize(deps: ReminderEventHandlerDependencies): Promise<void> {
    if (this.isInitialized) {
      logger.warn('[ReminderEventHandler] Already initialized, skipping');
      return;
    }

    const support = new ReminderHandlerSupport(
      deps.sseManager,
      deps.reminderTemplateRepository,
      deps.reminderGroupRepository,
      deps.scheduleTaskRepository,
    );

    const templateCreatedHandler = new ReminderTemplateCreatedHandler(support);
    const templateUpdatedHandler = new ReminderTemplateUpdatedHandler(support);
    const templateEnabledHandler = new ReminderTemplateEnabledHandler(support);
    const templatePausedHandler = new ReminderTemplatePausedHandler(support);
    const templateDeletedHandler = new ReminderTemplateDeletedHandler(support);
    const templateMovedHandler = new ReminderTemplateMovedHandler(support);

    const groupCreatedHandler = new ReminderGroupCreatedHandler(support);
    const groupUpdatedHandler = new ReminderGroupUpdatedHandler(support);
    const groupEnabledHandler = new ReminderGroupEnabledHandler(support);
    const groupPausedHandler = new ReminderGroupPausedHandler(support);
    const groupControlModeSwitchedHandler = new ReminderGroupControlModeSwitchedHandler(support);
    const groupDeletedHandler = new ReminderGroupDeletedHandler(support);

    const bus = eventBus as any;

    bus.on(
      'reminder:template:created',
      async (event: ReminderBusEvent<ReminderTemplateCreatedPayload>) => {
        await templateCreatedHandler.handle(event);
      },
    );

    bus.on(
      'reminder:template:updated',
      async (event: ReminderBusEvent<ReminderTemplateUpdatedPayload>) => {
        await templateUpdatedHandler.handle(event);
      },
    );

    bus.on(
      'reminder:template:enabled',
      async (event: ReminderBusEvent<ReminderTemplateEnabledPayload>) => {
        await templateEnabledHandler.handle(event);
      },
    );

    bus.on(
      'reminder:template:paused',
      async (event: ReminderBusEvent<ReminderTemplatePausedPayload>) => {
        await templatePausedHandler.handle(event);
      },
    );

    bus.on(
      'reminder:template:deleted',
      async (event: ReminderBusEvent<ReminderTemplateDeletedPayload>) => {
        await templateDeletedHandler.handle(event);
      },
    );

    bus.on(
      'reminder:template:moved',
      async (event: ReminderBusEvent<ReminderTemplateMovedPayload>) => {
        await templateMovedHandler.handle(event);
      },
    );

    bus.on(
      'reminder:group:created',
      async (event: ReminderBusEvent<ReminderGroupCreatedPayload>) => {
        await groupCreatedHandler.handle(event);
      },
    );

    bus.on(
      'reminder:group:updated',
      async (event: ReminderBusEvent<ReminderGroupUpdatedPayload>) => {
        await groupUpdatedHandler.handle(event);
      },
    );

    bus.on(
      'reminder:group:enabled',
      async (event: ReminderBusEvent<ReminderGroupEnabledPayload>) => {
        await groupEnabledHandler.handle(event);
      },
    );

    bus.on('reminder:group:paused', async (event: ReminderBusEvent<ReminderGroupPausedPayload>) => {
      await groupPausedHandler.handle(event);
    });

    bus.on(
      'reminder:group:control-mode-switched',
      async (event: ReminderBusEvent<ReminderGroupControlModeSwitchedPayload>) => {
        await groupControlModeSwitchedHandler.handle(event);
      },
    );

    bus.on(
      'reminder:group:deleted',
      async (event: ReminderBusEvent<ReminderGroupDeletedPayload>) => {
        await groupDeletedHandler.handle(event);
      },
    );

    this.isInitialized = true;
    logger.info('[ReminderEventHandler] Reminder event listeners initialized');
  }
}
