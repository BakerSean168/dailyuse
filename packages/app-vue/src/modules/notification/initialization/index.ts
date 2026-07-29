/**
 * Notification module startup hook
 *
 * Replaces the old `registerNotificationInitializationTasks()` pattern.
 * Each runtime (web, desktop renderer) explicitly calls this during startup.
 */

import type {
  NotificationClientDTO,
  NotificationDispatchInAppEvent,
  NotificationEventMap,
} from '@memoflow/contracts/notification';
import { createTypedEventSubscriber, eventBus } from '@memoflow/utils/domain';
import { createLogger } from '@memoflow/utils/logger';
import { useNotificationStore } from '../stores/notification-store';

const logger = createLogger('notification:init');
const notificationEvents = createTypedEventSubscriber<
  Pick<NotificationEventMap, 'notification:dispatch_in_app'>
>(eventBus);

const handleNotificationDispatch = (event: NotificationDispatchInAppEvent): void => {
  const store = useNotificationStore();
  if (store.notifications.some((notification) => notification.id === event.id)) {
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
  } as unknown as NotificationClientDTO);
  store.incrementUnread();
};

/**
 * Creates a startup hook that subscribes to in-app notification events.
 * Call this in the runtime composition root, not via global InitializationManager.
 */
export function createNotificationStartupHook(): { start(): void; stop(): void } {
  let started = false;

  return {
    start() {
      if (started) return;
      started = true;

      notificationEvents.on('notification:dispatch_in_app', handleNotificationDispatch);

      logger.info('Notification event handlers initialized');
    },

    stop() {
      if (!started) return;
      started = false;
      notificationEvents.off('notification:dispatch_in_app', handleNotificationDispatch);
    },
  };
}