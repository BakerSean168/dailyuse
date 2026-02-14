/**
 * Goal Module - Domain Events
 * 
 * All domain event types for the Goal module
 */

export type { GoalCreatedEvent } from './goal-created.event';
export type { GoalUpdatedEvent } from './goal-updated.event';
export type { GoalStatusChangedEvent } from './goal-status-changed.event';
export type { GoalCompletedEvent } from './goal-completed.event';
export type { GoalArchivedEvent } from './goal-archived.event';
export type { GoalDeletedEvent } from './goal-deleted.event';

export type { KeyResultAddedEvent } from './key-result-added.event';
export type { KeyResultUpdatedEvent } from './key-result-updated.event';
export type { KeyResultDeletedEvent } from './key-result-deleted.event';

export type { ReviewAddedEvent } from './review-added.event';

export type { GoalFolderCreatedEvent } from './goal-folder-created.event';
export type { GoalFolderUpdatedEvent } from './goal-folder-updated.event';
export type { GoalFolderDeletedEvent } from './goal-folder-deleted.event';
export type { GoalFolderStatsUpdatedEvent } from './goal-folder-stats-updated.event';

export type { FocusSessionStartedEvent } from './focus-session-started.event';
export type { FocusSessionPausedEvent } from './focus-session-paused.event';
export type { FocusSessionResumedEvent } from './focus-session-resumed.event';
export type { FocusSessionCompletedEvent } from './focus-session-completed.event';
export type { FocusSessionCancelledEvent } from './focus-session-cancelled.event';

// Re-export union type
export type { GoalCreatedEvent as GoalDomainEvent } from './goal-created.event';
