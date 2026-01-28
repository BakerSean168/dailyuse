import type { AccountStatus as IAccountStatus } from '@dailyuse/contracts/account';

// Branded Type - 账户状态值对象
export type AccountStatus = IAccountStatus & { readonly __brand: unique symbol };

// 伴生对象 - 提供行为逻辑
export const AccountStatus = {
  // 预定义值
  ACTIVE: 'ACTIVE' as AccountStatus,
  SUSPENDED: 'SUSPENDED' as AccountStatus,
  DEACTIVATED: 'DEACTIVATED' as AccountStatus,

  // 工厂方法
  of(value: string): AccountStatus {
    const validValues = [this.ACTIVE, this.SUSPENDED, this.DEACTIVATED];
    const status = validValues.find(s => s === value);
    if (!status) {
      throw new Error(`Invalid account status: ${value}`);
    }
    return status;
  },

  // 行为方法
  isActive(status: AccountStatus): boolean {
    return status === this.ACTIVE;
  },

  isSuspended(status: AccountStatus): boolean {
    return status === this.SUSPENDED;
  },

  isDeactivated(status: AccountStatus): boolean {
    return status === this.DEACTIVATED;
  },

  canLogin(status: AccountStatus): boolean {
    return status === this.ACTIVE;
  },

  canBeSuspended(status: AccountStatus): boolean {
    return status === this.ACTIVE;
  },

  canBeActivated(status: AccountStatus): boolean {
    return status === this.SUSPENDED || status === this.DEACTIVATED;
  }
};