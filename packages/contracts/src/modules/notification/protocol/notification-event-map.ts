import type { NotificationId } from '@/primitives';
import type { NotificationServerDTO } from '../aggregates/notification-server';
import type { NotificationStatus } from '../value-objects';

/**
 * 通知创建事件
 */
export interface NotificationCreatedEvent {
  type: 'notification.created';
  aggregateId: NotificationId;
  timestamp: Date;
  payload: {
    notification: NotificationServerDTO;
    sendImmediately: boolean;
  };
}

/**
 * 通知发送事件
 */
export interface NotificationSentEvent {
  type: 'notification.sent';
  aggregateId: NotificationId;
  timestamp: Date;
  payload: {
    notificationUuid: NotificationId;
    channels: string[];
  };
}

/**
 * 通知已读事件
 */
export interface NotificationReadEvent {
  type: 'notification.read';
  aggregateId: NotificationId;
  timestamp: Date;
  payload: {
    notificationUuid: NotificationId;
    readAt: number;
  };
}

/**
 * 通知删除事件
 */
export interface NotificationDeletedEvent {
  type: 'notification.deleted';
  aggregateId: NotificationId;
  timestamp: Date;
  payload: {
    notificationUuid: NotificationId;
  };
}

/**
 * 通知状态变更事件
 */
export interface NotificationStatusChangedEvent {
  type: 'notification.status.changed';
  aggregateId: NotificationId;
  timestamp: Date;
  payload: {
    previousStatus: NotificationStatus;
    newStatus: NotificationStatus;
    reason?: string;
  };
}

/**
 * Notification Event Map
 * 定义所有通知相关的事件
 */
export interface NotificationEventMap {
  'notification.created': {
    aggregateId: NotificationId;
    timestamp: Date;
    payload: {
      notification: NotificationServerDTO;
      sendImmediately: boolean;
    };
  };
  'notification.sent': {
    aggregateId: NotificationId;
    timestamp: Date;
    payload: {
      notificationUuid: NotificationId;
      channels: string[];
    };
  };
  'notification.read': {
    aggregateId: NotificationId;
    timestamp: Date;
    payload: {
      notificationUuid: NotificationId;
      readAt: number;
    };
  };
  'notification.deleted': {
    aggregateId: NotificationId;
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
