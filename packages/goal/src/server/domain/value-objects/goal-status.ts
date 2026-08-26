import {
  GoalStatus as GoalStatusContract,
  type GoalStatus as IGoalStatus,
} from '@memoflow/contracts/goal';

export type GoalStatus = IGoalStatus & { readonly __brand: unique symbol };

const VALUES: IGoalStatus[] = Object.values(GoalStatusContract);

export const GoalStatus = {
  Active: 'Active' as GoalStatus,
  Completed: 'Completed' as GoalStatus,
  Abandoned: 'Abandoned' as GoalStatus,

  of(value: string): GoalStatus {
    if (!this.isValid(value)) throw new Error(`Invalid GoalStatus: ${value}`);
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

  isAbandoned(status: GoalStatus): boolean {
    return status === this.Abandoned;
  },

  isTerminal(status: GoalStatus): boolean {
    return this.isCompleted(status) || this.isAbandoned(status);
  },
};
