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
  'reminder:template:created': ReminderTemplateCreatedEvent;

  /**
   * Reminder template updated event
   * Triggered when reminder template is updated
   */
  'reminder:template:updated': ReminderTemplateUpdatedEvent;

  /**
   * Reminder template enabled event
   * Triggered when reminder template is enabled
   */
  'reminder:template:enabled': ReminderTemplateUpdatedEvent;

  /**
   * Reminder template paused event
   * Triggered when reminder template is paused
   */
  'reminder:template:paused': ReminderTemplateUpdatedEvent;

  /**
   * Reminder template deleted event
   * Triggered when reminder template is deleted
   */
  'reminder:template:deleted': ReminderTemplateDeletedEvent;

  /**
   * Reminder template moved event
   * Triggered when reminder template is moved between groups
   */
  'reminder:template:moved': ReminderTemplateUpdatedEvent;

  /**
   * Reminder group created event
   * Triggered when reminder group is created
   */
  'reminder:group:created': ReminderGroupCreatedEvent;

  /**
   * Reminder group updated event
   * Triggered when reminder group is updated
   */
  'reminder:group:updated': ReminderGroupUpdatedEvent;

  /**
   * Reminder group enabled event
   * Triggered when reminder group is enabled
   */
  'reminder:group:enabled': ReminderGroupUpdatedEvent;

  /**
   * Reminder group paused event
   * Triggered when reminder group is paused
   */
  'reminder:group:paused': ReminderGroupUpdatedEvent;

  /**
   * Reminder group control mode switched event
   * Triggered when reminder group control mode changes
   */
  'reminder:group:control-mode-switched': ReminderGroupUpdatedEvent;

  /**
   * Reminder group deleted event
   * Triggered when reminder group is deleted
   */
  'reminder:group:deleted': ReminderGroupDeletedEvent;

  /**
   * Reminder triggered event
   * Triggered when reminder fires
   */
  'reminder:triggered': ReminderTriggeredEvent;

  /**
   * Reminder response recorded event
   * Triggered when a user responds to a reminder
   */
  'reminder:response:recorded': ReminderTriggeredEvent;

  /**
   * Reminder frequency adjusted event
   * Triggered when reminder frequency is adjusted
   */
  'reminder:frequency:adjusted': ReminderTriggeredEvent;

  /**
   * Reminder frequency adjustment rejected event
   * Triggered when adjustment is rejected
   */
  'reminder:frequency:adjustment-rejected': ReminderTriggeredEvent;
};
