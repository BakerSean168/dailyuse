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
const VALUES: IAuthIdentityStatus[] = ['Active', 'Locked', 'Disabled', 'Unverified'];

/**
 * 伴生对象 - 提供静态方法和行为逻辑
 */
export const AuthIdentityStatus = {
  // ================= 常量定义 =================

  Active: 'Active' as AuthIdentityStatus,
  Locked: 'Locked' as AuthIdentityStatus,
  Disabled: 'Disabled' as AuthIdentityStatus,
  Unverified: 'Unverified' as AuthIdentityStatus,

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
