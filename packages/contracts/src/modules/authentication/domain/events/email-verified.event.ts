import type { IdentityId } from '../../../../primitives';

/**
 * Email verified event
 *
 * Triggered when an AuthIdentity email identifier is verified.
 * Account projects ContactEmail from this event.
 */
export interface EmailVerifiedEvent {
  identityId: IdentityId;
  email: string;
}
