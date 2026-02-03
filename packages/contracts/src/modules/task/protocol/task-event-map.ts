import type {
  TaskCreatedEvent,
  TaskUpdatedEvent,
  TaskDeletedEvent,
  TaskCompletedEvent,
  TaskUncompletedEvent,
  TaskRescheduledEvent,
} from '../domain/events';

/**
 * Task Module - Event Map
 * 
 * Event Naming Convention: task:<action>
 * Maps event names to their payload types for type-safe event handling
 */

export type TaskEventMap = {
  /**
   * Task created event
   * Triggered when task instance is created
   */
  'task:create': TaskCreatedEvent;

  /**
   * Task updated event
   * Triggered when task is updated
   */
  'task:update': TaskUpdatedEvent;

  /**
   * Task deleted event
   * Triggered when task is deleted
   */
  'task:delete': TaskDeletedEvent;

  /**
   * Task completed event
   * Triggered when task is marked complete
   */
  'task:complete': TaskCompletedEvent;

  /**
   * Task uncompleted event
   * Triggered when task completion is reverted
   */
  'task:uncomplete': TaskUncompletedEvent;

  /**
   * Task rescheduled event
   * Triggered when task is rescheduled to different date
   */
  'task:reschedule': TaskRescheduledEvent;
};