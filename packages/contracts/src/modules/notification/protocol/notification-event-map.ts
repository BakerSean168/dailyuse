import type { NotificationId } from '@/primitives';
import type { NotificationServerDTO } from '../aggregates/notification-server';
import type { NotificationStatus } from '../value-objects';

/**
 * Notification Domain Event Map
 * 
 * Event Naming Convention: notification:<action>
 * - notification:create - Notification created
 * - notification:send - Notification sent
 * - notification:read - Notification read
 * - notification:delete - Notification deleted
 * - notification:status-change - Notification status changed
 */
export interface NotificationEventMap {
  'notification:create': {
    aggregateId: NotificationId;
    timestamp: Date;
    payload: {
      notification: NotificationServerDTO;
      sendImmediately: boolean;
    };
  };
  
  'notification:send': {
    aggregateId: NotificationId;
    timestamp: Date;
    payload: {
      notificationUuid: NotificationId;
      channels: string[];
    };
  };
  
  'notification:read': {
    aggregateId: NotificationId;
    timestamp: Date;
    payload: {
      notificationUuid: NotificationId;
      readAt: number;
    };
  };
  
  'notification:delete': {
    aggregateId: NotificationId;
    timestamp: Date;
    payload: {
      notificationUuid: NotificationId;
    };
  };
  
  'notification:status-change': {
    aggregateId: NotificationId;
    timestamp: Date;
    payload: {
      previousStatus: NotificationStatus;
      newStatus: NotificationStatus;
      reason?: string;
    };
  };
}
    timestamp: Date;
    payload: {
      notificationUuid: NotificationId;
    };
  };
  'notification.status.changed': {
    aggregateId: NotificationId;
    timestamp: Date;
    payload: {
      previousStatus: NotificationStatus;
      newStatus: NotificationStatus;
      reason?: string;
    };
  };
}

/**
 * Notification 领域事件联合类型
 */
export type NotificationDomainEvent =
  | NotificationCreatedEvent
  | NotificationSentEvent
  | NotificationReadEvent
  | NotificationDeletedEvent
  | NotificationStatusChangedEvent;
