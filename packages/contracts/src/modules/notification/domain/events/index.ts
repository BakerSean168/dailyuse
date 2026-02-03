/**
 * Notification Module - Domain Events
 * 
 * All domain event types for the Notification module
 */

export type { NotificationCreatedEvent } from './notification-created.event';
export type { NotificationSentEvent } from './notification-sent.event';
export type { NotificationReadEvent } from './notification-read.event';
export type { NotificationDeletedEvent } from './notification-deleted.event';
export type { NotificationStatusChangedEvent } from './notification-status-changed.event';
export type { NotificationChannelFailedEvent } from './notification-channel-failed.event';

// Re-export union type
export type { NotificationCreatedEvent as NotificationDomainEvent } from './notification-created.event';
