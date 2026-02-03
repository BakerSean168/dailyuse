/**
 * Task Module - Domain Events
 * 
 * All domain event types for the Task module
 */

export type { TaskCreatedEvent } from './task-created.event';
export type { TaskUpdatedEvent } from './task-updated.event';
export type { TaskDeletedEvent } from './task-deleted.event';
export type { TaskCompletedEvent } from './task-completed.event';
export type { TaskUncompletedEvent } from './task-uncompleted.event';
export type { TaskRescheduledEvent } from './task-rescheduled.event';

// Re-export union type
export type { TaskCreatedEvent as TaskDomainEvent } from './task-created.event';
