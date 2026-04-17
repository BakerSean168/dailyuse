import type { GoalCreatedEvent } from '../domain/events/goal-created.event';
import type { GoalUpdatedEvent } from '../domain/events/goal-updated.event';
import type { GoalStatusChangedEvent } from '../domain/events/goal-status-changed.event';
import type { GoalCompletedEvent } from '../domain/events/goal-completed.event';
import type { GoalArchivedEvent } from '../domain/events/goal-archived.event';
import type { GoalDeletedEvent } from '../domain/events/goal-deleted.event';
import type { GoalScheduleTimeChangedEvent } from '../domain/events/goal-schedule-time-changed.event';
import type { GoalReminderConfigChangedEvent } from '../domain/events/goal-reminder-config-changed.event';
import type { KeyResultAddedEvent } from '../domain/events/key-result-added.event';
import type { KeyResultUpdatedEvent } from '../domain/events/key-result-updated.event';
import type { KeyResultDeletedEvent } from '../domain/events/key-result-deleted.event';
import type { ReviewAddedEvent } from '../domain/events/review-added.event';
import type { GoalFolderCreatedEvent } from '../domain/events/goal-folder-created.event';
import type { GoalFolderUpdatedEvent } from '../domain/events/goal-folder-updated.event';
import type { GoalFolderDeletedEvent } from '../domain/events/goal-folder-deleted.event';
import type { GoalFolderStatsUpdatedEvent } from '../domain/events/goal-folder-stats-updated.event';
import type { FocusSessionStartedEvent } from '../domain/events/focus-session-started.event';
import type { FocusSessionPausedEvent } from '../domain/events/focus-session-paused.event';
import type { FocusSessionResumedEvent } from '../domain/events/focus-session-resumed.event';
import type { FocusSessionCompletedEvent } from '../domain/events/focus-session-completed.event';
import type { FocusSessionCancelledEvent } from '../domain/events/focus-session-cancelled.event';

/**
 * Goal Module - Event Map
 *
 * Event Naming Convention: goal:<action>
 * Maps event names to their payload types for type-safe event handling
 */

export type GoalEventMap = {
  // ============ Goal Events ============

  /**
   * Goal created event
   * Triggered when a new goal is created
   */
  'goal:create': GoalCreatedEvent;

  /**
   * Goal updated event
   * Triggered when goal is updated
   */
  'goal:update': GoalUpdatedEvent;

  /**
   * Goal status changed event
   * Triggered when goal status changes
   */
  'goal:status-change': GoalStatusChangedEvent;

  /**
   * Goal completed event
   * Triggered when goal is completed
   */
  'goal:complete': GoalCompletedEvent;

  /**
   * Goal archived event
   * Triggered when goal is archived
   */
  'goal:archive': GoalArchivedEvent;

  /**
   * Goal deleted event
   * Triggered when goal is deleted
   */
  'goal:delete': GoalDeletedEvent;

  /**
   * Goal schedule time changed event
   * Triggered when goal time range changes
   */
  'goal:schedule-time-changed': GoalScheduleTimeChangedEvent;

  /**
   * Goal reminder config changed event
   * Triggered when goal reminder config changes
   */
  'goal:reminder-config-changed': GoalReminderConfigChangedEvent;

  // ============ KeyResult Events ============

  /**
   * Key result added event
   * Triggered when key result is added to goal
   */
  'goal:key-result-add': KeyResultAddedEvent;

  /**
   * Key result updated event
   * Triggered when key result is updated
   */
  'goal:key-result-update': KeyResultUpdatedEvent;

  /**
   * Key result deleted event
   * Triggered when key result is deleted
   */
  'goal:key-result-delete': KeyResultDeletedEvent;

  // ============ GoalReview Events ============

  /**
   * Review added event
   * Triggered when review is added to goal
   */
  'goal:review-add': ReviewAddedEvent;

  // ============ GoalFolder Events ============

  /**
   * Folder created event
   * Triggered when goal folder is created
   */
  'goal:folder-create': GoalFolderCreatedEvent;

  /**
   * Folder updated event
   * Triggered when folder is updated
   */
  'goal:folder-update': GoalFolderUpdatedEvent;

  /**
   * Folder deleted event
   * Triggered when folder is deleted
   */
  'goal:folder-delete': GoalFolderDeletedEvent;

  /**
   * Folder statistics updated event
   * Triggered when folder stats are recalculated
   */
  'goal:folder-stats-update': GoalFolderStatsUpdatedEvent;

  // ============ FocusSession Events ============

  /**
   * Focus session started event
   * Triggered when focus session begins
   */
  'goal:focus-session-start': FocusSessionStartedEvent;

  /**
   * Focus session paused event
   * Triggered when focus session is paused
   */
  'goal:focus-session-pause': FocusSessionPausedEvent;

  /**
   * Focus session resumed event
   * Triggered when focus session resumes
   */
  'goal:focus-session-resume': FocusSessionResumedEvent;

  /**
   * Focus session completed event
   * Triggered when focus session completes
   */
  'goal:focus-session-complete': FocusSessionCompletedEvent;

  /**
   * Focus session cancelled event
   * Triggered when focus session is cancelled
   */
  'goal:focus-session-cancel': FocusSessionCancelledEvent;
};
