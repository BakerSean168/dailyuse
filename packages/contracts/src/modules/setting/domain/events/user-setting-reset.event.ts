import type { IdentityId } from '../../../../primitives';

/**
 * User Setting Reset Event
 *
 * Triggered when: User setting is reset to defaults
 *
 * Note: aggregateId and occurredAt are automatically set by the domain event system.
 */
export interface UserSettingResetEvent {
  readonly identityId: IdentityId;
  readonly category?: string;
}
