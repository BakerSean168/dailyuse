import type { SessionStatus as ISessionStatus } from '@dailyuse/contracts/authentication';

/**
 * 🔐 会话状态 - 用户登录会话的生命周期状态
 *
 * Branded Type：运行时为 string，编译时具有类型安全性
 */
export type SessionStatus = ISessionStatus & { readonly __brand: unique symbol };

/**
 * 合法值集合 - Single Source of Truth
 */
const VALUES: ISessionStatus[] = ['ACTIVE', 'EXPIRED', 'REVOKED'];

/**
 * 伴生对象 - 提供静态方法和行为逻辑
 */
export const SessionStatus = {
  // ================= 常量定义 =================

  ACTIVE: 'ACTIVE' as SessionStatus,
  EXPIRED: 'EXPIRED' as SessionStatus,
  REVOKED: 'REVOKED' as SessionStatus,

  // ================= 工厂方法 =================

  /**
   * 🏭 工厂方法：验证并转换
   */
  of(value: string): SessionStatus {
    if (!this.isValid(value)) {
      throw new Error(`Invalid session status: ${value}`);
    }
    return value as SessionStatus;
  },

  // ================= 类型守卫 =================

  /**
   * 🛡️ 类型守卫：运行时类型检查
   */
  isValid(value: string): value is SessionStatus {
    return VALUES.includes(value as ISessionStatus);
  },

  /**
   * 📋 获取所有可用值
   */
  getAll(): SessionStatus[] {
    return VALUES as SessionStatus[];
  },

  // ================= 行为方法 (State Logic) =================

  /**
   * 会话是否处于活跃状态
   */
  isActive(status: SessionStatus): boolean {
    return status === this.ACTIVE;
  },

  /**
   * 会话是否已过期
   */
  isExpired(status: SessionStatus): boolean {
    return status === this.EXPIRED;
  },

  /**
   * 会话是否已被撤销（用户主动登出）
   */
  isRevoked(status: SessionStatus): boolean {
    return status === this.REVOKED;
  },

  /**
   * 会话是否已终止（过期或撤销）
   */
  isTerminated(status: SessionStatus): boolean {
    return this.isExpired(status) || this.isRevoked(status);
  },

  /**
   * 是否可以恢复为活跃状态
   * （如 INACTIVE 可以通过用户交互恢复）
   */
  isRecoverable(status: SessionStatus): boolean {
    return false;
  },

  /**
   * 获取 UI 显示名称
   */
  getDisplayName(status: SessionStatus): string {
    const map: Record<ISessionStatus, string> = {
      'ACTIVE': '活跃',
      'EXPIRED': '已过期',
      'REVOKED': '已登出'
    };
    return map[status as ISessionStatus] ?? '未知';
  },

  /**
   * 获取状态描述
   */
  getDescription(status: SessionStatus): string {
    const map: Record<ISessionStatus, string> = {
      'ACTIVE': '当前会话活跃，您已登录',
      'EXPIRED': '会话已过期，请重新登录',
      'REVOKED': '您已登出，会话已终止',
    };
    return map[status as ISessionStatus] ?? '会话状态未知';
  },

  /**
   * 获取代表状态的 CSS/UI 样式类
   */
  getStyleClass(status: SessionStatus): string {
    const map: Record<ISessionStatus, string> = {
      'ACTIVE': 'status-success',
      'EXPIRED': 'status-danger',
      'REVOKED': 'status-secondary',
    };
    return map[status as ISessionStatus] ?? 'status-unknown';
  }
};
