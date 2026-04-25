import { useNotificationStore } from '@dailyuse/app-vue';
import type { NotificationDispatchInAppEvent } from '@dailyuse/contracts/notification';
import {
  InitializationManager,
  InitializationPhase,
  createLogger,
  eventBus,
  type InitializationTask,
} from '@dailyuse/utils';

const logger = createLogger('notification-runtime:init');

export function registerNotificationInitializationTasks(): void {
  const manager = InitializationManager.getInstance();

  const notificationEventHandlersInitTask: InitializationTask = {
    name: 'notification:event-handlers',
    phase: InitializationPhase.APP_STARTUP,
    priority: 30,
    initialize: async () => {
      eventBus.on(
        'notification:dispatch_in_app' as any,
        (event: NotificationDispatchInAppEvent) => {
          const store = useNotificationStore();
          if (store.notifications.some((notification: { id: string }) => notification.id === event.id)) {
            return;
          }

          store.addNotification({
            id: event.id,
            identityId: event.identityId,
            title: event.title,
            content: event.body ?? '',
            type: event.type,
            category: event.category,
            isRead: false,
            status: 'Unread',
            importance: event.importance ?? 'Moderate',
            version: 1,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            readAt: null,
            sentAt: null,
            deletedAt: null,
          } as any);
          store.incrementUnread();
        },
      );

      logger.info('Notification event handlers initialized');
    },
  };

  manager.registerTask(notificationEventHandlersInitTask);
  logger.info('Notification initialization tasks registered');
}
