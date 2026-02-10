import type { AccountStatus as IAccountStatus } from '@dailyuse/contracts/account';

export type AccountStatus = IAccountStatus & { readonly __brand: unique symbol };

const VALUES: IAccountStatus[] = ['ACTIVE', 'SUSPENDED', 'DEACTIVATED'];

export const AccountStatus = {
  ACTIVE: 'ACTIVE' as AccountStatus,
  SUSPENDED: 'SUSPENDED' as AccountStatus,
  DEACTIVATED: 'DEACTIVATED' as AccountStatus,

  of(value: string): AccountStatus {
    if (!this.isValid(value)) {
      throw new Error(`Invalid account status: ${value}`);
    }
    return value;
  },

  isValid(value: string): value is AccountStatus {
    return VALUES.includes(value as IAccountStatus);
  },

  getAll(): AccountStatus[] {
    return VALUES as AccountStatus[];
  },

  isActive(status: AccountStatus): boolean { return status === this.ACTIVE; },
  isSuspended(status: AccountStatus): boolean { return status === this.SUSPENDED; },
  isDeactivated(status: AccountStatus): boolean { return status === this.DEACTIVATED; },
  canLogin(status: AccountStatus): boolean { return status === this.ACTIVE; },
  canBeSuspended(status: AccountStatus): boolean { return status === this.ACTIVE; },
  canBeActivated(status: AccountStatus): boolean {
    return status === this.SUSPENDED || status === this.DEACTIVATED;
  },
};
