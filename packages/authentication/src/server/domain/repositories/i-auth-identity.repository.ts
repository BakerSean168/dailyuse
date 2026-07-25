import type { IdentityId } from '@dailyuse/contracts/authentication';
import type { OAuthProvider } from '..';
import type { AuthIdentity } from '../aggregates/auth-identity';

/**
 * Repository interface for the AuthIdentity aggregate root.
 * Handles persistence and querying of AuthIdentity.
 *
 * Phone login is not a first-party surface; PhoneIdentifier may still exist on
 * portable identity data, but phone lookup methods are not part of the runtime port.
 */
export interface IAuthIdentityRepository {
  /**
   * Saves or updates an identity.
   * On insert: persists the aggregate root to the database.
   * On update: detects changes and applies them (or overwrites entirely).
   */
  save(identity: AuthIdentity): Promise<void>;

  /**
   * Finds an identity by ID.
   * Used for retrieving current user info, changing passwords, etc.
   */
  findById(id: IdentityId): Promise<AuthIdentity | null>;

  /**
   * Finds an identity by email (for email login / registration uniqueness check).
   * Note: although email is part of a Credential, we need to locate the owning Identity.
   */
  findByEmail(email: string): Promise<AuthIdentity | null>;

  /**
   * Finds an identity by OAuth info (for third-party login).
   * Matches on provider and openId (sub).
   */
  findByOAuth(provider: OAuthProvider, subjectId: string): Promise<AuthIdentity | null>;

  /**
   * Checks whether an email already exists (optimized, returns boolean only).
   */
  existsByEmail(email: string): Promise<boolean>;

  /**
   * Deletes an identity (account deactivation).
   */
  delete(identity: AuthIdentity): Promise<void>;
}
