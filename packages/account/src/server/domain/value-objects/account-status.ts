import { AccountStatus as AccountStatusContract, type AccountStatus as IAccountStatus } from '@dailyuse/contracts/account';

export type AccountStatus = IAccountStatus & { readonly __brand: unique symbol };

// Derive the valid-value set from the contracts source of truth so a new status
// only ever has to be added in one place (@dailyuse/contracts).
const VALUES: IAccountStatus[] = Object.values(AccountStatusContract);

export const AccountStatus = {
  Active: 'Active' as AccountStatus,
  Suspended: 'Suspended' as AccountStatus,
  Deactivated: 'Deactivated' as AccountStatus,

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

  isActive(status: AccountStatus): boolean {
    return status === this.Active;
  },
  isSuspended(status: AccountStatus): boolean {
    return status === this.Suspended;
  },
  isDeactivated(status: AccountStatus): boolean {
    return status === this.Deactivated;
  },
  canLogin(status: AccountStatus): boolean {
    return status === this.Active;
  },
  canBeSuspended(status: AccountStatus): boolean {
    return status === this.Active;
  },
  canBeActivated(status: AccountStatus): boolean {
    return status === this.Suspended || status === this.Deactivated;
  },
};
