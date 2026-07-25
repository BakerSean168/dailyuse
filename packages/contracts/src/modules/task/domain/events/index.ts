/**
 * Task Module - Domain Events
 * 
 * All domain event types for the Task module
 */

export type { TaskCreatedEvent } from './task-created.event';
export type { TaskUpdatedEvent } from './task-updated.event';
export type { TaskDeletedEvent } from './task-deleted.event';
export type { TaskInstanceCompletedEvent } from './task-instance-completed.event';
export type { TaskInstanceSkippedEvent } from './task-instance-skipped.event';
export type { TaskInstanceDeletedEvent } from './task-instance-deleted.event';
export type { TaskInstancesGeneratedEvent } from './task-instances-generated.event';
export type { TaskTemplatePausedEvent } from './task-template-paused.event';
export type { TaskTemplateResumedEvent } from './task-template-resumed.event';
export type { TaskTemplateScheduleTimeChangedEvent } from './task-template-schedule-time-changed.event';
export type { TaskTemplateRecurrenceChangedEvent } from './task-template-recurrence-changed.event';
export type { TaskUncompletedEvent } from './task-uncompleted.event';
export type { TaskRescheduledEvent } from './task-rescheduled.event';
export type { TaskDependencyCreatedEvent } from './task-dependency-created.event';
export type { TaskDependencyUpdatedEvent } from './task-dependency-updated.event';
export type { TaskDependencyDeletedEvent } from './task-dependency-deleted.event';

