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
 * 通知模块 - 事件映射
 *
 * 事件命名规范：notification:{kebab-action-past-tense}
 */
export type NotificationEventMap = {
  'notification:created': NotificationCreatedEvent;
  'notification:sent': NotificationSentEvent;
  'notification:read': NotificationReadEvent;
  'notification:deleted': NotificationDeletedEvent;
  'notification:status-changed': NotificationStatusChangedEvent;
  'notification:channel-failed': NotificationChannelFailedEvent;

  /**
   * Dispatch events (integration, not domain events).
   * These use underscore convention for transport-layer events.
   */
  'notification:dispatch_desktop': NotificationDispatchDesktopEvent;
  'notification:dispatch_in_app': NotificationDispatchInAppEvent;
};
