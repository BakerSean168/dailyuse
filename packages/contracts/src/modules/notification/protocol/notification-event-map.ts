import type { NotificationCreatedEvent } from '../domain/events/notification-created.event';
import type { NotificationSentEvent } from '../domain/events/notification-sent.event';
import type { NotificationReadEvent } from '../domain/events/notification-read.event';
import type { NotificationDeletedEvent } from '../domain/events/notification-deleted.event';
import type { NotificationStatusChangedEvent } from '../domain/events/notification-status-changed.event';
import type { NotificationChannelFailedEvent } from '../domain/events/notification-channel-failed.event';
import type {
  NotificationDispatchDesktopEvent,
  NotificationDispatchInAppEvent,
} from './notification-dispatch-events';

/**
 * Notification Module - Event Map
 *
 * Event Naming Convention: notification:<action>
 * Maps event names to their payload types for type-safe event handling
 */

export type NotificationEventMap = {
  /**
   * Notification created event
   * Triggered when notification is created
   */
  'notification:create': NotificationCreatedEvent;

  /**
   * Notification sent event
   * Triggered when notification is sent through channels
   */
  'notification:send': NotificationSentEvent;

  /**
   * Notification read event
   * Triggered when notification is marked as read
   */
  'notification:read': NotificationReadEvent;

  /**
   * Notification deleted event
   * Triggered when notification is deleted
   */
  'notification:delete': NotificationDeletedEvent;

  /**
   * Notification status changed event
   * Triggered when notification status changes
   */
  'notification:status-change': NotificationStatusChangedEvent;

  /**
   * Notification channel failed event
   * Triggered when notification fails to send through channel
   */
  'notification:channel-failed': NotificationChannelFailedEvent;

  /**
   * Notification dispatch event (desktop)
   * Triggered when notification should be rendered on desktop
   */
  'notification:dispatch_desktop': NotificationDispatchDesktopEvent;

  /**
   * Notification dispatch event (in-app)
   * Triggered when notification should be rendered in app
   */
  'notification:dispatch_in_app': NotificationDispatchInAppEvent;
};
