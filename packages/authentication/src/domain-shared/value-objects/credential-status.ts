import type { CredentialStatus as ICredentialStatus } from '@dailyuse/contracts/authentication';

/**
 * 🔐 凭证状�?- 认证凭据的生命周期状�?
 *
 * Branded Type：运行时�?string，编译时具有类型安全�?
 */
export type CredentialStatus = ICredentialStatus & { readonly __brand: unique symbol };

/**
 * 合法值集�?- Single Source of Truth
 */
const VALUES: ICredentialStatus[] = ['Active', 'Suspended', 'Expired', 'Revoked'];

/**
 * 伴生对象 - 提供静态方法和行为逻辑
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
