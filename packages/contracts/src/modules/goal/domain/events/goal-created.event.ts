import type { GoalServerDTO } from '../../aggregates/goal-server';
import type { IdentityId, GoalFolderId } from '../../../../primitives';

/**
 * Goal Created Event
 *
 * Triggered when: New goal is created
 * Subscribers: Goal folder stats, User statistics, Notification service
 *
 * Note: aggregateId (goalId) is automatically set by the domain event system.
 * Note: occurredAt timestamp is automatically set by the domain event system.
 */
export interface GoalCreatedEvent {
  /** User/Identity identifier */
  identityId: IdentityId;

  /** Parent folder identifier (if any) */
  folderId: GoalFolderId | null;

  /** Created goal snapshot */
  goal: GoalServerDTO;
}
