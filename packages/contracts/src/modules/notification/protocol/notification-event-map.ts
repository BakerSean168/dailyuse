import type {
  NotificationCreatedEvent,
  NotificationSentEvent,
  NotificationReadEvent,
  NotificationDeletedEvent,
  NotificationStatusChangedEvent,
  NotificationChannelFailedEvent,
} from '../domain/events';

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
};

