import { SessionStatus as SessionStatusContract, type SessionStatus as ISessionStatus } from '@memoflow/contracts/authentication';

/**
 * Session status - lifecycle state of a user login session.
 *
 * Branded type: string at runtime, with compile-time type safety.
 */
export type SessionStatus = ISessionStatus & { readonly __brand: unique symbol };

/**
 * Valid values set - Single Source of Truth.
 */
// Derive the valid-value set from the contracts source of truth so a new status
// only ever has to be added in one place (@memoflow/contracts).
const VALUES: ISessionStatus[] = Object.values(SessionStatusContract);

/**
 * Companion object providing static methods and behavior logic.
 */
export const SessionStatus = {
  // ================= Constants =================

  Active: 'Active' as SessionStatus,
  Expired: 'Expired' as SessionStatus,
  Revoked: 'Revoked' as SessionStatus,

  // ================= Factory Methods =================

  /**
   * Factory method: validates and converts a string to SessionStatus.
   */
  of(value: string): SessionStatus {
    if (!this.isValid(value)) {
      throw new Error(`Invalid session status: ${value}`);
    }
    return value as SessionStatus;
  },

  // ================= Type Guards =================

  /**
   * Type guard: runtime type check for SessionStatus values.
   */
  isValid(value: string): value is SessionStatus {
    return VALUES.includes(value as ISessionStatus);
  },

  /**
   * Returns all available session status values.
   */
  getAll(): SessionStatus[] {
    return VALUES as SessionStatus[];
  },

  // ================= Behavior Methods (State Logic) =================

  /**
   * Checks whether the session is active.
   */
  isActive(status: SessionStatus): boolean {
    return status === this.Active;
  },

  /**
   * Checks whether the session has expired.
   */
  isExpired(status: SessionStatus): boolean {
    return status === this.Expired;
  },

  /**
   * Checks whether the session has been revoked (user actively logged out).
   */
  isRevoked(status: SessionStatus): boolean {
    return status === this.Revoked;
  },

  /**
   * Checks whether the session has been terminated (expired or revoked).
   */
  isTerminated(status: SessionStatus): boolean {
    return this.isExpired(status) || this.isRevoked(status);
  },

  /**
   * Checks whether the session can be recovered to active status.
   */
  isRecoverable(_status: SessionStatus): boolean {
    return false;
  },
};
