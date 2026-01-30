import type { AuthIdentityStatus as IAuthIdentityStatus } from '@dailyuse/contracts/authentication';

/**
 * 👤 身份状态 - 用户身份验证的生命周期状态
 *
 * Branded Type：运行时为 string，编译时具有类型安全性
 */
export type AuthIdentityStatus = IAuthIdentityStatus & { readonly __brand: unique symbol };

/**
 * 合法值集合 - Single Source of Truth
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

  /**
   * 🏭 工厂方法：验证并转换
   */
  of(value: string): AuthIdentityStatus {
    if (!this.isValid(value)) {
      throw new Error(`Invalid identity status: ${value}`);
    }
    return value as AuthIdentityStatus;
  },

  // ================= 类型守卫 =================

  /**
   * 🛡️ 类型守卫：运行时类型检查
   */
  isValid(value: string): value is AuthIdentityStatus {
    return VALUES.includes(value as IAuthIdentityStatus);
  },

  /**
   * 📋 获取所有可用值
   */
  getAll(): AuthIdentityStatus[] {
    return VALUES as AuthIdentityStatus[];
  },

  // ================= 行为方法 (State Logic) =================

  /**
   * 身份是否已验证（ACTIVE 状态）
   */
  isVerified(status: AuthIdentityStatus): boolean {
    return status === this.ACTIVE;
  },

  /**
   * 身份是否未验证
   */
  isUnverified(status: AuthIdentityStatus): boolean {
    return status === this.UNVERIFIED;
  },

  /**
   * 身份是否已被禁用
   */
  isDisabled(status: AuthIdentityStatus): boolean {
    return status === this.DISABLED;
  },

  /**
   * 身份是否已被锁定（由于安全原因，可能需要管理员解锁）
   */
  isLocked(status: AuthIdentityStatus): boolean {
    return status === this.LOCKED;
  },

  /**
   * 身份是否处于活跃状态（可以正常登录）
   */
  isActive(status: AuthIdentityStatus): boolean {
    return status === this.ACTIVE;
  },

  /**
   * 身份是否处于非活跃状态（无法登录）
   */
  isInactive(status: AuthIdentityStatus): boolean {
    return status === this.UNVERIFIED || status === this.DISABLED || status === this.LOCKED;
  },

  /**
   * 身份是否需要用户干预（如验证邮件）
   */
  requiresUserAction(status: AuthIdentityStatus): boolean {
    return status === this.UNVERIFIED;
  },

  /**
   * 身份是否需要管理员干预
   */
  requiresAdminAction(status: AuthIdentityStatus): boolean {
    return status === this.LOCKED || status === this.DISABLED;
  },

  /**
   * 获取 UI 显示名称
   */
  getDisplayName(status: AuthIdentityStatus): string {
    const map: Record<IAuthIdentityStatus, string> = {
      'ACTIVE': '已激活',
      'LOCKED': '已锁定',
      'DISABLED': '已禁用',
      'UNVERIFIED': '未验证'
    };
    return map[status as IAuthIdentityStatus] ?? '未知';
  },

  /**
   * 获取状态描述
   */
  getDescription(status: AuthIdentityStatus): string {
    const map: Record<IAuthIdentityStatus, string> = {
      'ACTIVE': '您的身份已激活，可以正常使用服务',
      'LOCKED': '您的身份已被锁定，请联系管理员',
      'DISABLED': '您的身份已被禁用，无法使用服务',
      'UNVERIFIED': '您的身份尚未验证，请完成验证流程'
    };
    return map[status as IAuthIdentityStatus] ?? '身份状态未知';
  },

  /**
   * 获取代表状态的 CSS/UI 样式类
   */
  getStyleClass(status: AuthIdentityStatus): string {
    const map: Record<IAuthIdentityStatus, string> = {
      'ACTIVE': 'status-success',
      'LOCKED': 'status-danger',
      'DISABLED': 'status-warning',
      'UNVERIFIED': 'status-info'
    };
    return map[status as IAuthIdentityStatus] ?? 'status-unknown';
  }
};
