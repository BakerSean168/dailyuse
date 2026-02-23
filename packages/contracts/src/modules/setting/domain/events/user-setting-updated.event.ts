/**
 * User Setting Updated Event
 *
 * Triggered when: User setting values are changed
 *
 * Note: aggregateId and occurredAt are automatically set by the domain event system.
 */
export interface UserSettingUpdatedEvent {
  readonly identityId: string;
  readonly changedKeys: string[];
}
