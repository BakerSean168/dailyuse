/**
 * Notification module initialization tasks
 */

import {
  InitializationManager,
  InitializationPhase,
  type InitializationTask,
  createLogger,
  eventBus,
} from '@dailyuse/utils';
import type { NotificationDispatchInAppEvent } from '@dailyuse/contracts/notification';
import { useNotificationStore } from '../stores/notificationStore';
const logger = createLogger('notification:init');

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
          if (store.notifications.some((n) => n.id === event.id)) {
            return;
          }
          store.addNotification({
            id: event.id,
            identityId: event.identityId,
            title: event.title,
            content: event.body ?? '',
            type: event.type,
            category: event.category,
            status: 'Unread',
            importance: event.importance ?? 'Moderate',
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
