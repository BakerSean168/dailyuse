import type { CredentialStatus as ICredentialStatus } from '@dailyuse/contracts/authentication';

/**
 * 🔐 凭证状态 - 认证凭据的生命周期状态
 *
 * Branded Type：运行时为 string，编译时具有类型安全性
 */
export type CredentialStatus = ICredentialStatus & { readonly __brand: unique symbol };

/**
 * 合法值集合 - Single Source of Truth
 */
const VALUES: ICredentialStatus[] = ['ACTIVE', 'SUSPENDED', 'EXPIRED', 'REVOKED'];

/**
 * 伴生对象 - 提供静态方法和行为逻辑
 */
export const CredentialStatus = {
  // ================= 常量定义 =================

  ACTIVE: 'ACTIVE' as CredentialStatus,
  SUSPENDED: 'SUSPENDED' as CredentialStatus,
  EXPIRED: 'EXPIRED' as CredentialStatus,
  REVOKED: 'REVOKED' as CredentialStatus,

  // ================= 工厂方法 =================

  /**
   * 🏭 工厂方法：验证并转换
   */
  of(value: string): CredentialStatus {
    if (!this.isValid(value)) {
      throw new Error(`Invalid credential status: ${value}`);
    }
    return value as CredentialStatus;
  },

  // ================= 类型守卫 =================

  /**
   * 🛡️ 类型守卫：运行时类型检查
   */
  isValid(value: string): value is CredentialStatus {
    return VALUES.includes(value as ICredentialStatus);
  },

  /**
   * 📋 获取所有可用值
   */
  getAll(): CredentialStatus[] {
    return VALUES as CredentialStatus[];
  },

  // ================= 行为方法 (State Logic) =================

  /**
   * 凭证是否处于活跃状态，可以正常使用
   */
  isActive(status: CredentialStatus): boolean {
    return status === this.ACTIVE;
  },

  /**
   * 凭证是否可用（不是已过期或已撤销）
   */
  isUsable(status: CredentialStatus): boolean {
    return status === this.ACTIVE || status === this.SUSPENDED;
  },

  /**
   * 凭证是否已被挂起
   */
  isSuspended(status: CredentialStatus): boolean {
    return status === this.SUSPENDED;
  },

  /**
   * 凭证是否已过期
   */
  isExpired(status: CredentialStatus): boolean {
    return status === this.EXPIRED;
  },

  /**
   * 凭证是否已被撤销（不可恢复）
   */
  isRevoked(status: CredentialStatus): boolean {
    return status === this.REVOKED;
  },

  /**
   * 凭证是否已失效（已过期或已撤销）
   */
  isInvalid(status: CredentialStatus): boolean {
    return this.isExpired(status) || this.isRevoked(status);
  },

  /**
   * 获取 UI 显示名称
   */
  getDisplayName(status: CredentialStatus): string {
    const map: Record<ICredentialStatus, string> = {
      'ACTIVE': '活跃',
      'SUSPENDED': '已挂起',
      'EXPIRED': '已过期',
      'REVOKED': '已撤销'
    };
    return map[status as ICredentialStatus] ?? '未知';
  },

  /**
   * 获取状态描述（用于用户信息展示）
   */
  getDescription(status: CredentialStatus): string {
    const map: Record<ICredentialStatus, string> = {
      'ACTIVE': '此凭证处于活跃状态，可以正常使用',
      'SUSPENDED': '此凭证已被暂时挂起，无法使用',
      'EXPIRED': '此凭证已过期，请重新设置',
      'REVOKED': '此凭证已被撤销，无法恢复'
    };
    return map[status as ICredentialStatus] ?? '状态未知';
  },

  /**
   * 获取代表状态的 CSS/UI 样式类
   */
  getStyleClass(status: CredentialStatus): string {
    const map: Record<ICredentialStatus, string> = {
      'ACTIVE': 'status-active',
      'SUSPENDED': 'status-warning',
      'EXPIRED': 'status-danger',
      'REVOKED': 'status-danger'
    };
    return map[status as ICredentialStatus] ?? 'status-unknown';
  }
};
