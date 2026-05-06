/**
 * Notification Module Initialization Tasks (LEGACY)
 * 通知模块初始化任务（遗留文件）
 *
 * @deprecated This file is superseded by `./runtime.ts` which uses the
 * composition-root lifecycle pattern (start/stop) instead of the
 * InitializationManager singleton. No internal consumers remain —
 * kept only for reference during the migration period.
 *
 * 此文件已被 `./runtime.ts` 取代，后者使用组合根生命周期模式（start/stop）
 * 而非 InitializationManager 单例。内部已无消费者 —— 仅在迁移期间保留作参考。
 *
 * @see ./runtime.ts for the new implementation
 * Register event handlers and background tasks to InitializationManager.
 */

import {
  InitializationManager,
  InitializationPhase,
  type InitializationTask,
  generateUUID,
  eventBus,
} from '@dailyuse/utils';
import type {
  NotificationDispatchDesktopEvent,
  NotificationDispatchInAppEvent,
} from '@dailyuse/contracts/notification';
import { NotificationCategory, NotificationType } from '@dailyuse/contracts/notification';
import type { ReminderEventMap, NotificationChannel } from '@dailyuse/contracts/reminder';
import { ImportanceLevel, UrgencyLevel } from '@dailyuse/contracts/shared';
import type { ScheduleEventMap } from '@dailyuse/contracts/schedule';
import { SourceModule, ExecutionStatus } from '@dailyuse/contracts/schedule';
import type { NotificationId, IdentityId } from '@dailyuse/contracts/primitives';

const notificationEventHandlersInitTask: InitializationTask = {
  name: 'notificationEventHandlers',
  phase: InitializationPhase.APP_STARTUP,
  priority: 35,
  initialize: async () => {
    const handleReminderTriggered = (event: ReminderEventMap['reminder:triggered']): void => {
      const reminder = event.reminder;
      if (!event.identityId || !reminder?.id) {
        console.warn('[NotificationInit] Missing reminder identity or id');
        return;
      }

      const title = reminder.notificationConfig?.title || reminder.name || 'Reminder';
      const body = reminder.notificationConfig?.body || reminder.description || null;
      const soundConfig = reminder.notificationConfig?.sound ?? null;
      const channels = reminder.notificationConfig?.channels ?? [];

      const base: NotificationDispatchDesktopEvent & NotificationDispatchInAppEvent = {
        id: generateUUID() as NotificationId,
        identityId: event.identityId as IdentityId,
        title,
        body,
        category: NotificationCategory.Reminder,
        type: NotificationType.Reminder,
        urgency: UrgencyLevel.High,
        importance: reminder.importanceLevel ?? ImportanceLevel.Moderate,
        data: {
          source: 'reminder:triggered',
          reminderId: reminder.id,
        },
        sound: soundConfig
          ? { enabled: !!soundConfig.enabled, name: soundConfig.soundName ?? null }
          : { enabled: true, name: null },
      };

      if (!channels.length || channels.includes('InApp')) {
        eventBus.send('notification:dispatch_in_app', base);
      }

      eventBus.send('notification:dispatch_desktop', base);
    };

    const handleScheduleExecuted = (event: ScheduleEventMap['schedule:task:executed']): void => {
      const identityId = event.identityId;
      if (!identityId) {
        console.warn('[NotificationInit] Missing identityId in schedule:task:executed');
        return;
      }

      if (event.status && event.status !== ExecutionStatus.Success) {
        return;
      }

      const payload = event.payload ?? {};
      const taskId = event.taskId;
      const sourceModule = event.sourceModule;
      const titleFallback =
        sourceModule === SourceModule.Goal
          ? 'Goal reminder'
          : sourceModule === SourceModule.Task
            ? 'Task reminder'
            : sourceModule === SourceModule.Reminder
              ? 'Reminder'
              : 'Schedule task';

      const title =
        (typeof payload['goalTitle'] === 'string' ? payload['goalTitle'] : undefined) ||
        (typeof payload['taskTitle'] === 'string' ? payload['taskTitle'] : undefined) ||
        (typeof payload['reminderTitle'] === 'string' ? payload['reminderTitle'] : undefined) ||
        titleFallback;

      const base: NotificationDispatchDesktopEvent & NotificationDispatchInAppEvent = {
        id: generateUUID() as NotificationId,
        identityId: identityId as IdentityId,
        title,
        body: null,
        category:
          sourceModule === SourceModule.Goal
            ? NotificationCategory.Goal
            : sourceModule === SourceModule.Task
              ? NotificationCategory.Task
              : sourceModule === SourceModule.Reminder
                ? NotificationCategory.Reminder
                : NotificationCategory.Schedule,
        type: NotificationType.Reminder,
        urgency: UrgencyLevel.Medium,
        importance: ImportanceLevel.Moderate,
        data: {
          source: 'schedule:task:executed',
          scheduleTaskId: taskId,
          sourceModule,
          payload,
        },
        sound: { enabled: true, name: null },
      };

      eventBus.send('notification:dispatch_desktop', base);
      eventBus.send('notification:dispatch_in_app', base);
    };

    eventBus.on('reminder:triggered', handleReminderTriggered);
    eventBus.on('schedule:task:executed', handleScheduleExecuted);
    console.log('✓ Notification event handlers initialized');
  },
};

const notificationJobsInitTask: InitializationTask = {
  name: 'notificationJobs',
  phase: InitializationPhase.APP_STARTUP,
  priority: 36,
  initialize: async () => {
    console.log('✓ Notification background jobs initialized');
  },
};

export function registerNotificationInitializationTasks(): void {
  const manager = InitializationManager.getInstance();
  manager.registerTask(notificationEventHandlersInitTask);
  manager.registerTask(notificationJobsInitTask);
  console.log('Notification module initialization tasks registered');
}
