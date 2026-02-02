import type { GoalStatus as IGoalStatus } from '@dailyuse/contracts/goal';

export type GoalStatus = IGoalStatus & { readonly __brand: unique symbol };

const VALUES: IGoalStatus[] = ['Active', 'Completed', 'Archived'];

export const GoalStatus = {
  Active: 'Active' as GoalStatus,
  Completed: 'Completed' as GoalStatus,
  Archived: 'Archived' as GoalStatus,

  of(value: string): GoalStatus {
    if (!this.isValid(value)) {
      throw new Error(`Invalid GoalStatus: ${value}`);
    }
    return value as GoalStatus;
  },

  isValid(value: string): value is GoalStatus {
    return VALUES.includes(value as IGoalStatus);
  },

  getAll(): GoalStatus[] {
    return VALUES as GoalStatus[];
  },

  isActive(status: GoalStatus): boolean {
    return status === this.Active;
  },

  isCompleted(status: GoalStatus): boolean {
    return status === this.Completed;
  },

  isArchived(status: GoalStatus): boolean {
    return status === this.Archived;
  },

  isTerminal(status: GoalStatus): boolean {
    return this.isCompleted(status) || this.isArchived(status);
  },
};
