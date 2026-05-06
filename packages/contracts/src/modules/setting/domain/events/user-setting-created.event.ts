import type { IdentityId } from '../../../../primitives';

/**
 * User Setting Created Event
 *
 * Triggered when: A new user setting aggregate is created
 */
export interface UserSettingCreatedEvent {
  readonly identityId: IdentityId;
}
