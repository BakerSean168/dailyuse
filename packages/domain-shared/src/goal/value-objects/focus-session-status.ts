import type { FocusSessionStatus as IFocusSessionStatus } from '@dailyuse/contracts/goal';

export type FocusSessionStatus = IFocusSessionStatus & { readonly __brand: unique symbol };

const VALUES: IFocusSessionStatus[] = ['Active', 'Completed', 'Cancelled'];

export const FocusSessionStatus = {
  Active: 'Active' as FocusSessionStatus,
  Completed: 'Completed' as FocusSessionStatus,
  Cancelled: 'Cancelled' as FocusSessionStatus,

  of(value: string): FocusSessionStatus {
    if (!this.isValid(value)) {
      throw new Error(`Invalid FocusSessionStatus: ${value}`);
    }
    return value as FocusSessionStatus;
  },

  isValid(value: string): value is FocusSessionStatus {
    return VALUES.includes(value as IFocusSessionStatus);
  },

  getAll(): FocusSessionStatus[] {
    return VALUES as FocusSessionStatus[];
  },

  isActive(status: FocusSessionStatus): boolean {
    return status === this.Active;
  },

  isTerminal(status: FocusSessionStatus): boolean {
    return status === this.Completed || status === this.Cancelled;
  },
};
