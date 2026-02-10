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
const VALUES: ICredentialStatus[] = ['ACTIVE', 'SUSPENDED', 'EXPIRED', 'REVOKED'];

/**
 * 伴生对象 - 提供静态方法和行为逻辑
 */
export const CredentialStatus = {
  ACTIVE: 'ACTIVE' as CredentialStatus,
  SUSPENDED: 'SUSPENDED' as CredentialStatus,
  EXPIRED: 'EXPIRED' as CredentialStatus,
  REVOKED: 'REVOKED' as CredentialStatus,

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
    return status === this.ACTIVE;
  },

  isUsable(status: CredentialStatus): boolean {
    return status === this.ACTIVE || status === this.SUSPENDED;
  },

  isSuspended(status: CredentialStatus): boolean {
    return status === this.SUSPENDED;
  },

  isExpired(status: CredentialStatus): boolean {
    return status === this.EXPIRED;
  },

  isRevoked(status: CredentialStatus): boolean {
    return status === this.REVOKED;
  },

  isInvalid(status: CredentialStatus): boolean {
    return this.isExpired(status) || this.isRevoked(status);
  },
};
