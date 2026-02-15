import type { Goal } from '../aggregates/goal';
import { GoalStatus } from '@dailyuse/contracts/goal';
import { GoalArchivedError, GoalDeletedError } from '../value-objects';

/**
 * GoalPolicy
 *
 * Cross-aggregate and external-state validations for Goal workflows.
 */
export class GoalPolicy {
  ensureGoalCanBeModified(goal: Goal): void {
    if (goal.deletedAt) {
      throw new GoalDeletedError(goal.id);
    }
    if (goal.status === GoalStatus.Archived) {
      throw new GoalArchivedError(goal.id);
    }
  }

  ensureGoalCanBeDeleted(goal: Goal): void {
    if (goal.deletedAt) {
      throw new GoalDeletedError(goal.id);
    }
  }

  ensureGoalCanBeArchived(goal: Goal): void {
    if (goal.deletedAt) {
      throw new GoalDeletedError(goal.id);
    }
    if (goal.status === GoalStatus.Active) {
      throw new Error('Active goals must be completed before archiving');
    }
  }

  ensureGoalCanBeActivated(goal: Goal): void {
    if (goal.deletedAt) {
      throw new GoalDeletedError(goal.id);
    }
  }

  ensureParentGoalValid(parentGoal?: Goal | null): void {
    if (!parentGoal) {
      return;
    }
    if (parentGoal.deletedAt) {
      throw new GoalDeletedError(parentGoal.id);
    }
    if (parentGoal.status === GoalStatus.Archived) {
      throw new GoalArchivedError(parentGoal.id);
    }
  }
}
