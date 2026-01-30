import type { AccountStatus as IAccountStatus } from '@dailyuse/contracts/account';

/**
 * 🔐 账户状态 - 用户账号的生命周期状态
 * 
 * Branded Type：运行时为 string，编译时具有类型安全性
 * 零序列化成本，内存开销极小
 */
export type AccountStatus = IAccountStatus & { readonly __brand: unique symbol };

/**
 * 合法值集合 - Single Source of Truth
 * 用于校验和遍历
 */
const VALUES: IAccountStatus[] = ['ACTIVE', 'SUSPENDED', 'DEACTIVATED'];

/**
 * 伴生对象 - 提供静态方法和行为逻辑
 * 没有 this，所有行为方法第一个参数都是该 Type 的实例
 */
export const AccountStatus = {
  // ================= 常量定义 =================
  
  ACTIVE: 'ACTIVE' as AccountStatus,
  SUSPENDED: 'SUSPENDED' as AccountStatus,
  DEACTIVATED: 'DEACTIVATED' as AccountStatus,

  // ================= 工厂方法 =================

  /**
   * 🏭 工厂方法：验证并转换
   * 接受任意 string，返回安全的 AccountStatus
   * @throws 当输入值不在合法值列表中时
   */
  of(value: string): AccountStatus {
    if (!this.isValid(value)) {
      throw new Error(`Invalid account status: ${value}`);
    }
    return value;
  },

  // ================= 类型守卫 =================

  /**
   * 🛡️ 类型守卫：运行时类型检查
   * 用于条件判断时的类型细化
   * @example
   * if (AccountStatus.isValid(input)) {
   *   const status: AccountStatus = input; // TS 自动推断
   * }
   */
  isValid(value: string): value is AccountStatus {
    return VALUES.includes(value as IAccountStatus);
  },

  /**
   * 📋 获取所有可用值
   * 用于前端渲染下拉框、状态管理等场景
   */
  getAll(): AccountStatus[] {
    return VALUES as AccountStatus[];
  },

  // ================= 行为方法 (State Logic) =================

  /**
   * 是否账户已激活
   * （可以登录、进行操作）
   */
  isActive(status: AccountStatus): boolean {
    return status === this.ACTIVE;
  },

  /**
   * 是否账户已暂停
   * （可以恢复）
   */
  isSuspended(status: AccountStatus): boolean {
    return status === this.SUSPENDED;
  },

  /**
   * 是否账户已停用
   * （用户主动或被系统永久停用）
   */
  isDeactivated(status: AccountStatus): boolean {
    return status === this.DEACTIVATED;
  },

  /**
   * 是否可以登录
   * 仅激活状态的账户可以登录
   */
  canLogin(status: AccountStatus): boolean {
    return status === this.ACTIVE;
  },

  /**
   * 是否可以被暂停
   * 仅激活状态的账户可以被暂停
   */
  canBeSuspended(status: AccountStatus): boolean {
    return status === this.ACTIVE;
  },

  /**
   * 是否可以被重新激活
   * 暂停或停用状态的账户可以被激活
   */
  canBeActivated(status: AccountStatus): boolean {
    return status === this.SUSPENDED || status === this.DEACTIVATED;
  },

  /**
   * 获取 UI 显示名称（用于列表展示、状态指示）
   */
  getDisplayName(status: AccountStatus): string {
    const map: Record<IAccountStatus, string> = {
      'ACTIVE': '活跃',
      'SUSPENDED': '暂停',
      'DEACTIVATED': '停用',
    };
    return map[status as IAccountStatus] ?? '未知';
  }
};