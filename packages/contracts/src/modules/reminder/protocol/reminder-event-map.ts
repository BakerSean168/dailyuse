import type {
  ReminderTemplateCreatedEvent,
  ReminderTemplateUpdatedEvent,
  ReminderTemplateDeletedEvent,
  ReminderGroupCreatedEvent,
  ReminderGroupUpdatedEvent,
  ReminderGroupDeletedEvent,
  ReminderTriggeredEvent,
} from '../domain/events';

/**
 * Reminder Module - Event Map
 * 
 * Event Naming Convention: reminder:<action>
 * Maps event names to their payload types for type-safe event handling
 */

export type ReminderEventMap = {
  /**
   * Reminder template created event
   * Triggered when reminder template is created
   */
  'reminder:create': ReminderTemplateCreatedEvent;

  /**
   * Reminder template updated event
   * Triggered when reminder template is updated
   */
  'reminder:update': ReminderTemplateUpdatedEvent;

  /**
   * Reminder template deleted event
   * Triggered when reminder template is deleted
   */
  'reminder:delete': ReminderTemplateDeletedEvent;

  /**
   * Reminder group created event
   * Triggered when reminder group is created
   */
  'reminder:group-create': ReminderGroupCreatedEvent;

  /**
   * Reminder group updated event
   * Triggered when reminder group is updated
   */
  'reminder:group-update': ReminderGroupUpdatedEvent;

  /**
   * Reminder group deleted event
   * Triggered when reminder group is deleted
   */
  'reminder:group-delete': ReminderGroupDeletedEvent;

  /**
   * Reminder triggered event
   * Triggered when reminder fires
   */
  'reminder:trigger': ReminderTriggeredEvent;
};

