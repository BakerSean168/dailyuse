import type { AuthSessionId, IdentityId } from '@dailyuse/contracts/authentication';
import type { AuthSession } from '../aggregates/auth-session';

/**
 * Repository interface for the AuthSession aggregate root.
 * Handles session lifecycle management.
 */
export interface IAuthSessionRepository {
  /**
   * Saves a session (new login or renewal).
   */
  save(session: AuthSession): Promise<void>;

  /**
   * Finds a session by ID (for token validation).
   */
  findById(id: AuthSessionId): Promise<AuthSession | null>;

  /**
   * Finds all sessions for a user (for "my devices" list).
   */
  findByIdentityId(identityId: IdentityId): Promise<AuthSession[]>;

  /**
   * Finds and refreshes a token.
   * (Some implementations may need a separate method for atomic access token updates.)
   */
  // updateToken(sessionId: SessionId, newToken: string): Promise<void>; // Optional, depends on implementation

  /**
   * Removes a single session (logout / kick).
   */
  remove(session: AuthSession): Promise<void>;

  /**
   * Removes all sessions for a user (forced logout after password change / account ban).
   */
  removeAllByIdentityId(identityId: IdentityId): Promise<void>;

  /**
   * Cleans up expired sessions (scheduled task).
   */
  removeExpired(): Promise<void>;
}
