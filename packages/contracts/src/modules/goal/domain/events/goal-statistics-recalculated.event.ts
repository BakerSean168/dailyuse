/**
 * Goal Statistics Recalculated Event
 * 
 * Triggered when: User goal statistics need recalculation
 * Subscribers: Statistics cache, User dashboard
 * 
 * Note: aggregateId (identityId) is automatically set by the domain event system.
 * Note: occurredAt timestamp is automatically set by the domain event system.
 */
export interface GoalStatisticsRecalculatedEvent {}
