import type { IdentityId, KeyResultId } from '../../../../primitives';

/**
 * Goal Record Created Event
 *
 * Triggered when: A new goal record (value measurement) is created
 * Subscribers: Goal statistics service
 *
 * Note: aggregateId is automatically set by the domain event system.
 * Note: occurredAt timestamp is automatically set by the domain event system.
 */
export interface GoalRecordCreatedEvent {
  identityId: IdentityId;
  keyResultId: KeyResultId;
  value: number;
  note: string | null;
}
