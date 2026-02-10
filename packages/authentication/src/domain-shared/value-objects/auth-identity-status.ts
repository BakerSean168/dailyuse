import type { AuthIdentityStatus as IAuthIdentityStatus } from '@dailyuse/contracts/authentication';

/**
 * 👤 身份状�?- 用户身份验证的生命周期状�?
 *
 * Branded Type：运行时�?string，编译时具有类型安全�?
 */
export type AuthIdentityStatus = IAuthIdentityStatus & { readonly __brand: unique symbol };

/**
 * 合法值集�?- Single Source of Truth
 */
const VALUES: IAuthIdentityStatus[] = ["ACTIVE", "LOCKED", "DISABLED", "UNVERIFIED"];

/**
 * 伴生对象 - 提供静态方法和行为逻辑
 */
export const AuthIdentityStatus = {
  // ================= 常量定义 =================

  ACTIVE: 'ACTIVE' as AuthIdentityStatus,
  LOCKED: 'LOCKED' as AuthIdentityStatus,
  DISABLED: 'DISABLED' as AuthIdentityStatus,
  UNVERIFIED: 'UNVERIFIED' as AuthIdentityStatus,

  // ================= 工厂方法 =================

  of(value: string): AuthIdentityStatus {
    if (!this.isValid(value)) {
      throw new Error(`Invalid identity status: ${value}`);
    }
    return value as AuthIdentityStatus;
  },

  // ================= 类型守卫 =================

  isValid(value: string): value is AuthIdentityStatus {
    return VALUES.includes(value as IAuthIdentityStatus);
  },

  getAll(): AuthIdentityStatus[] {
    return VALUES as AuthIdentityStatus[];
  },

  // ================= 行为方法 (State Logic) =================

  isVerified(status: AuthIdentityStatus): boolean {
    return status === this.ACTIVE;
  },

  isUnverified(status: AuthIdentityStatus): boolean {
    return status === this.UNVERIFIED;
  },

  isDisabled(status: AuthIdentityStatus): boolean {
    return status === this.DISABLED;
  },

  isLocked(status: AuthIdentityStatus): boolean {
    return status === this.LOCKED;
  },

  isActive(status: AuthIdentityStatus): boolean {
    return status === this.ACTIVE;
  },

  isInactive(status: AuthIdentityStatus): boolean {
    return status === this.UNVERIFIED || status === this.DISABLED || status === this.LOCKED;
  },

  requiresUserAction(status: AuthIdentityStatus): boolean {
    return status === this.UNVERIFIED;
  },

  requiresAdminAction(status: AuthIdentityStatus): boolean {
    return status === this.LOCKED || status === this.DISABLED;
  },

};
