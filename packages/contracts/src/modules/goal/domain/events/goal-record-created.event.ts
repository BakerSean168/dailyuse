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
  keyResultId: string;
  value: number;
  note: string | null;
}
