import type { IdentityId } from '../../../../primitives';

export const IdentityCreateMethod = {
  Email: 'Email',
  Oauth: 'Oauth',
  Phone: 'Phone',
} as const;

export type IdentityCreateMethod = (typeof IdentityCreateMethod)[keyof typeof IdentityCreateMethod];

/**
 * Identity Created Event
 *
 * Triggered when a new AuthIdentity is created
 * Used by other modules (e.g., Account) to create corresponding entities
 */
export interface IdentityCreatedEvent {
  /** Identity identifier */
  identityId: IdentityId;

  /** Creation method: Email, Oauth, Phone */
  createMethod: IdentityCreateMethod;

  /** Verified or pending email address, when the creation method provides one. */
  email?: string;

  /** OAuth provider (for Oauth creation) */
  oauthProvider?: string;

  /** Phone number (for Phone creation) */
  phoneNumber?: string;
}
