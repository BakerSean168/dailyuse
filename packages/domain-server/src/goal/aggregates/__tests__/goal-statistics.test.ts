import { describe, it, expect } from 'vitest';
import { GoalStatistics } from '../GoalStatistics';
import { GoalStatus } from '@dailyuse/contracts/goal';
import { ImportanceLevel, UrgencyLevel } from '@dailyuse/contracts/shared';

describe('GoalStatistics aggregate event handlers', () => {
  it('increments totalGoals and activeGoals on goal.created', () => {
    const stats = GoalStatistics.createEmpty('account-1');

    const event = {
      type: 'goal.created' as const,
      accountUuid: 'account-1',
      timestamp: Date.now(),
      payload: {
        importance: 'MEDIUM' as ImportanceLevel,
        urgency: 'NONE' as UrgencyLevel,
        category: 'health',
        newStatus: 'ACTIVE' as GoalStatus,
      },
    };

    stats.onGoalCreated(event as any);

    expect(stats.totalGoals).toBe(1);
    expect(stats.activeGoals).toBe(1);
  });

  it('updates completedGoals on goal.completed', () => {
    const stats = GoalStatistics.createEmpty('account-2');

    const event = {
      type: 'goal.completed' as const,
      accountUuid: 'account-2',
      timestamp: Date.now(),
      payload: {
        newStatus: 'COMPLETED' as GoalStatus,
        completedAt: Date.now(),
      },
    };

    stats.onGoalCompleted(event as any);

    expect(stats.completedGoals).toBe(1);
  });
});
