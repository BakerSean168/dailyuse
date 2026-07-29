import { CredentialStatus as CredentialStatusContract, type CredentialStatus as ICredentialStatus } from '@memoflow/contracts/authentication';

/**
 * Credential Status - lifecycle state for authentication credentials.
 *
 * Branded Type: string at runtime, with compile-time type safety.
 */
export type CredentialStatus = ICredentialStatus & { readonly __brand: unique symbol };

/**
 * Valid value set - Single Source of Truth
 */
// Derive the valid-value set from the contracts source of truth so a new status
// only ever has to be added in one place (@memoflow/contracts).
const VALUES: ICredentialStatus[] = Object.values(CredentialStatusContract);

/**
 * Companion object - provides static methods and behavior logic.
 */
export const CredentialStatus = {
  Active: 'Active' as CredentialStatus,
  Suspended: 'Suspended' as CredentialStatus,
  Expired: 'Expired' as CredentialStatus,
  Revoked: 'Revoked' as CredentialStatus,

  of(value: string): CredentialStatus {
    if (!this.isValid(value)) {
      throw new Error(`Invalid credential status: ${value}`);
    }
    return value as CredentialStatus;
  },

  isValid(value: string): value is CredentialStatus {
    return VALUES.includes(value as ICredentialStatus);
  },

  getAll(): CredentialStatus[] {
    return VALUES as CredentialStatus[];
  },

  isActive(status: CredentialStatus): boolean {
    return status === this.Active;
  },

  isUsable(status: CredentialStatus): boolean {
    return status === this.Active || status === this.Suspended;
  },

  isSuspended(status: CredentialStatus): boolean {
    return status === this.Suspended;
  },

  isExpired(status: CredentialStatus): boolean {
    return status === this.Expired;
  },

  isRevoked(status: CredentialStatus): boolean {
    return status === this.Revoked;
  },

  isInvalid(status: CredentialStatus): boolean {
    return this.isExpired(status) || this.isRevoked(status);
  },
};
