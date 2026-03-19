import { FocusSession } from '../aggregates/focus-session';
import type { Goal } from '../aggregates/goal';
import { GoalStatus } from '@dailyuse/contracts/goal';

/**
 * FocusSessionPolicy
 *
 * Cross-aggregate rules and external state validation for focus sessions.
 */
export class FocusSessionPolicy {
  /**
   * Rule: a user cannot have more than one active session at a time.
   */
  ensureNoActiveSession(existingSessions: FocusSession[]): void {
    const hasActive = existingSessions.some((session) => session.isActive());
    if (hasActive) {
      throw new Error('您有正在进行的专注周期，请先完成或取消');
    }
  }

  /**
   * Rule: the associated goal must belong to the user and be in a valid state.
   */
  ensureGoalIsValid(goal: Goal | null, identityId: string): void {
    if (!goal) {
      throw new Error('关联的目标不存在');
    }

    if (goal.identityId !== identityId) {
      throw new Error('无权关联此目标，目标不属于当前账户');
    }

    if (goal.archivedAt || goal.status === GoalStatus.Archived || goal.deletedAt) {
      throw new Error('不能关联已归档或已删除的目标');
    }
  }
}
