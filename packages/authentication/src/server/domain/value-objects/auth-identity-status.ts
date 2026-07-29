import { AuthIdentityStatus as AuthIdentityStatusContract, type AuthIdentityStatus as IAuthIdentityStatus } from '@memoflow/contracts/authentication';

/**
 * Identity Status - lifecycle state for user authentication identity.
 *
 * Branded Type: string at runtime, with compile-time type safety.
 */
export type AuthIdentityStatus = IAuthIdentityStatus & { readonly __brand: unique symbol };

/**
 * Valid value set - Single Source of Truth
 */
// Derive the valid-value set from the contracts source of truth so a new status
// only ever has to be added in one place (@memoflow/contracts).
const VALUES: IAuthIdentityStatus[] = Object.values(AuthIdentityStatusContract);

/**
 * Companion object - provides static methods and behavior logic.
 */
export const AuthIdentityStatus = {
  // ================= Constants =================

  Active: 'Active' as AuthIdentityStatus,
  Locked: 'Locked' as AuthIdentityStatus,
  Disabled: 'Disabled' as AuthIdentityStatus,
  Unverified: 'Unverified' as AuthIdentityStatus,

  // ================= Factory Methods =================

  of(value: string): AuthIdentityStatus {
    if (!this.isValid(value)) {
      throw new Error(`Invalid identity status: ${value}`);
    }
    return value as AuthIdentityStatus;
  },

  // ================= Type Guards =================

  isValid(value: string): value is AuthIdentityStatus {
    return VALUES.includes(value as IAuthIdentityStatus);
  },

  getAll(): AuthIdentityStatus[] {
    return VALUES as AuthIdentityStatus[];
  },

  // ================= Behavior Methods (State Logic) =================

  isVerified(status: AuthIdentityStatus): boolean {
    return status === this.Active;
  },

  isUnverified(status: AuthIdentityStatus): boolean {
    return status === this.Unverified;
  },

  isDisabled(status: AuthIdentityStatus): boolean {
    return status === this.Disabled;
  },

  isLocked(status: AuthIdentityStatus): boolean {
    return status === this.Locked;
  },

  isActive(status: AuthIdentityStatus): boolean {
    return status === this.Active;
  },

  isInactive(status: AuthIdentityStatus): boolean {
    return status === this.Unverified || status === this.Disabled || status === this.Locked;
  },

  requiresUserAction(status: AuthIdentityStatus): boolean {
    return status === this.Unverified;
  },

  requiresAdminAction(status: AuthIdentityStatus): boolean {
    return status === this.Locked || status === this.Disabled;
  },
};
