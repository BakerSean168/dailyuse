/**
 * User Setting Reset Event
 *
 * Triggered when: User setting is reset to defaults
 *
 * Note: aggregateId and occurredAt are automatically set by the domain event system.
 */
export interface UserSettingResetEvent {
  readonly identityId: string;
  readonly category?: string;
}
