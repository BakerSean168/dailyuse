/**
 * Reminder Module - Domain Events
 * 
 * All domain event types for the Reminder module
 */

export type { ReminderTemplateCreatedEvent } from './reminder-template-created.event';
export type { ReminderTemplateUpdatedEvent } from './reminder-template-updated.event';
export type { ReminderTemplateEnabledEvent } from './reminder-template-enabled.event';
export type { ReminderTemplatePausedEvent } from './reminder-template-paused.event';
export type { ReminderTemplateMovedEvent } from './reminder-template-moved.event';
export type { ReminderTemplateDeletedEvent } from './reminder-template-deleted.event';
export type { ReminderGroupCreatedEvent } from './reminder-group-created.event';
export type { ReminderGroupUpdatedEvent } from './reminder-group-updated.event';
export type { ReminderGroupDeletedEvent } from './reminder-group-deleted.event';
export type { ReminderTriggeredEvent } from './reminder-triggered.event';

// Re-export union type
export type { ReminderTemplateCreatedEvent as ReminderDomainEvent } from './reminder-template-created.event';
