import type { Goal } from '../aggregates/goal';
import { GoalStatus } from '@dailyuse/contracts/goal';
import { GoalArchivedError } from '../value-objects';

/**
 * GoalPolicy
 *
 * Cross-aggregate and external-state validations for Goal workflows.
 */
export class GoalPolicy {
  ensureGoalCanBeModified(goal: Goal): void {
    if (goal.archivedAt) {
      throw new GoalArchivedError(goal.id);
    }
    if (goal.status === GoalStatus.Archived) {
      throw new GoalArchivedError(goal.id);
    }
  }

  /**
   * 检查目标是否可以归档
   * 活跃目标必须先完成才能归档
   */
  ensureGoalCanBeArchived(goal: Goal): void {
    if (goal.archivedAt) {
      throw new GoalArchivedError(goal.id);
    }
    if (goal.status === GoalStatus.Active) {
      throw new Error('Active goals must be completed before archiving');
    }
  }

  /**
   * 检查目标是否可以永久删除
   * 只有已归档的目标才能被永久删除
   */
  ensureGoalCanBePermanentlyDeleted(goal: Goal): void {
    if (!goal.canBePermanentlyDeleted()) {
      throw new Error(`Goal ${goal.id} must be archived before it can be permanently deleted`);
    }
  }

  ensureGoalCanBeActivated(goal: Goal): void {
    if (goal.archivedAt) {
      throw new GoalArchivedError(goal.id);
    }
  }

  ensureParentGoalValid(parentGoal?: Goal | null): void {
    if (!parentGoal) {
      return;
    }
    if (parentGoal.archivedAt) {
      throw new GoalArchivedError(parentGoal.id);
    }
    if (parentGoal.status === GoalStatus.Archived) {
      throw new GoalArchivedError(parentGoal.id);
    }
  }
}
