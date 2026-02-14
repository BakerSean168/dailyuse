import type {
  GoalCreatedEvent,
  GoalUpdatedEvent,
  GoalStatusChangedEvent,
  GoalCompletedEvent,
  GoalArchivedEvent,
  GoalDeletedEvent,
  KeyResultAddedEvent,
  KeyResultUpdatedEvent,
  KeyResultDeletedEvent,
  ReviewAddedEvent,
  GoalFolderCreatedEvent,
  GoalFolderUpdatedEvent,
  GoalFolderDeletedEvent,
  GoalFolderStatsUpdatedEvent,
  FocusSessionStartedEvent,
  FocusSessionPausedEvent,
  FocusSessionResumedEvent,
  FocusSessionCompletedEvent,
  FocusSessionCancelledEvent,
} from '../domain/events';

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
