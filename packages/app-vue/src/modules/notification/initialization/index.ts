/**
 * Notification module startup hook
 *
 * Replaces the old `registerNotificationInitializationTasks()` pattern.
 * Each runtime (web, desktop renderer) explicitly calls this during startup.
 */

import { createLogger, eventBus } from '@dailyuse/utils';
import type { NotificationDispatchInAppEvent } from '@dailyuse/contracts/notification';
import { useNotificationStore } from '../stores/notification-store';

const logger = createLogger('notification:init');

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

    stop() {
      if (!started) return;
      started = false;
      // eventBus cleanup would go here if eventBus supported off()
    },
  };
}

/** @deprecated Use createNotificationStartupHook() instead */
export function registerNotificationInitializationTasks(): void {
  const hook = createNotificationStartupHook();
  hook.start();
}
