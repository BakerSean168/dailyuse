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
 * 目标模块 - 事件映射
 *
 * 事件命名规范：goal:{kebab-entity}-{kebab-action-past-tense}
 */
export type GoalEventMap = {
  // ============ Goal Events ============
  'goal:created': GoalCreatedEvent;
  'goal:updated': GoalUpdatedEvent;
  'goal:status-changed': GoalStatusChangedEvent;
  'goal:completed': GoalCompletedEvent;
  'goal:archived': GoalArchivedEvent;
  'goal:deleted': GoalDeletedEvent;
  'goal:schedule-time-changed': GoalScheduleTimeChangedEvent;
  'goal:reminder-config-changed': GoalReminderConfigChangedEvent;

  // ============ KeyResult Events ============
  'goal:key-result-added': KeyResultAddedEvent;
  'goal:key-result-updated': KeyResultUpdatedEvent;
  'goal:key-result-deleted': KeyResultDeletedEvent;

  // ============ GoalReview Events ============
  'goal:review-added': ReviewAddedEvent;

  // ============ GoalFolder Events ============
  'goal:folder-created': GoalFolderCreatedEvent;
  'goal:folder-updated': GoalFolderUpdatedEvent;
  'goal:folder-deleted': GoalFolderDeletedEvent;
  'goal:folder-stats-updated': GoalFolderStatsUpdatedEvent;

  // ============ FocusSession Events ============
  'goal:focus-session-started': FocusSessionStartedEvent;
  'goal:focus-session-paused': FocusSessionPausedEvent;
  'goal:focus-session-resumed': FocusSessionResumedEvent;
  'goal:focus-session-completed': FocusSessionCompletedEvent;
  'goal:focus-session-cancelled': FocusSessionCancelledEvent;
};
