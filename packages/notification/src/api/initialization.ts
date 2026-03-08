/**
 * Notification Module Initialization Tasks
 *
 * Register event handlers and background tasks to InitializationManager.
 */

import {
  InitializationManager,
  InitializationPhase,
  type InitializationTask,
  generateUUID,
  eventBus,
} from '@dailyuse/utils';
import { NotificationCategory, NotificationType } from '@dailyuse/contracts/notification';
import type { NotificationChannel } from '@dailyuse/contracts/reminder';
import { ImportanceLevel, UrgencyLevel } from '@dailyuse/contracts/shared';
import { SourceModule } from '@dailyuse/contracts/schedule';
import { ExecutionStatus } from '@dailyuse/contracts/schedule';

const notificationEventHandlersInitTask: InitializationTask = {
  name: 'notificationEventHandlers',
  phase: InitializationPhase.APP_STARTUP,
  priority: 35,
  initialize: async () => {
    const handleReminderTriggered = (event: {
      identityId?: string;
      payload?: {
        reminder?: {
          id?: string;
          name?: string;
          description?: string | null;
          importanceLevel?: ImportanceLevel;
          notificationConfig?: {
            title?: string | null;
            body?: string | null;
            sound?: { enabled: boolean; soundName?: string | null } | null;
            channels?: NotificationChannel[];
          } | null;
        };
      };
    }): void => {
      const reminder = event.payload?.reminder;
      if (!event.identityId || !reminder?.id) {
        console.warn('[NotificationInit] Missing reminder identity or id');
        return;
      }

      const title = reminder.notificationConfig?.title || reminder.name || 'Reminder';
      const body = reminder.notificationConfig?.body || reminder.description || null;
      const soundConfig = reminder.notificationConfig?.sound ?? null;
      const channels = reminder.notificationConfig?.channels ?? [];

      const base = {
        id: generateUUID(),
        identityId: event.identityId,
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
        eventBus.send('notification:dispatch_in_app' as any, base as any);
      }

      eventBus.send('notification:dispatch_desktop' as any, base as any);
    };

    const handleScheduleExecuted = (event: {
      payload?: {
        taskId?: string;
        sourceModule?: SourceModule;
        status?: ExecutionStatus;
        payload?: Record<string, unknown>;
        identityId?: string;
      };
    }): void => {
      const identityId = event.payload?.identityId;
      if (!identityId) {
        console.warn('[NotificationInit] Missing identityId in schedule:task:executed');
        return;
      }

      if (event.payload?.status && event.payload.status !== ExecutionStatus.Success) {
        return;
      }

      const payload = event.payload?.payload ?? {};
      const taskId = event.payload?.taskId;
      const sourceModule = event.payload?.sourceModule;
      const titleFallback =
        sourceModule === SourceModule.Goal
          ? 'Goal reminder'
          : sourceModule === SourceModule.Task
            ? 'Task reminder'
            : sourceModule === SourceModule.Reminder
              ? 'Reminder'
              : 'Schedule task';

      const title =
        (payload.goalTitle as string | undefined) ||
        (payload.taskTitle as string | undefined) ||
        (payload.reminderTitle as string | undefined) ||
        titleFallback;

      const base = {
        id: generateUUID(),
        identityId,
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

      eventBus.send('notification:dispatch_desktop' as any, base as any);
      eventBus.send('notification:dispatch_in_app' as any, base as any);
    };

    eventBus.on('reminder:triggered' as any, handleReminderTriggered as any);
    eventBus.on('schedule:task:executed' as any, handleScheduleExecuted as any);
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
