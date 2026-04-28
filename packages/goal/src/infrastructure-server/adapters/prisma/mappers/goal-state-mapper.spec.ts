import { describe, it, expect } from 'vitest';
import { persistenceDtoToGoalState } from './goal-state-mapper';

describe('persistenceDtoToGoalState', () => {
  it('parses string fields and maps nested entities', () => {
    const dto = {
      id: 'goal-1',
      identityId: 'identity-1',
      name: 'Goal',
      description: null,
      color: '#123456',
      feasibilityAnalysis: null,
      motivation: null,
      status: 'InProgress',
      importance: 'Medium',
      priority: 10,
      category: null,
      tags: '["a","b"]',
      startDate: new Date(1_000),
      targetDate: new Date(2_000),
      completedAt: null,
      archivedAt: null,
      folderId: 'folder-1',
      parentGoalId: null,
      sortOrder: 1,
      reminderConfig: JSON.stringify({
        enabled: true,
        triggers: JSON.stringify([{ type: 'RemainingDays', value: 3, enabled: true }]),
      }),
      keyResults: [
        {
          id: 'kr-1',
          goalId: 'goal-1',
          title: 'KR',
          description: null,
          progress: JSON.stringify({ initialValue: 0, targetValue: 100 }),
          weight: 2,
          sortOrder: 3,
          version: 2,
          createdAt: new Date(1_000),
          updatedAt: new Date(1_500),
          deletedAt: null,
        },
      ],
      goalReviews: [
        {
          id: 'review-1',
          goalId: 'goal-1',
          type: 'Weekly',
          rating: 4,
          summary: 'ok',
          achievements: null,
          challenges: null,
          improvements: null,
          keyResultSnapshots: '[{"keyResultId":"kr-1","value":10}]',
          reviewedAt: new Date(1_200),
          version: 1,
          createdAt: new Date(1_200),
          updatedAt: new Date(1_300),
          deletedAt: null,
        },
      ],
      weightSnapshots: [
        {
          id: 'snapshot-1',
          goalId: 'goal-1',
          keyResultId: 'kr-1',
          identityId: 'identity-1',
          oldWeight: 1,
          newWeight: 2,
          weightDelta: 1,
          snapshotTime: 1_111,
          trigger: 'Manual',
          reason: null,
          operatorId: 'identity-1',
          createdAt: 1_112,
        },
      ],
      totalKeyResults: 1,
      completedKeyResults: 0,
      createdAt: new Date(900),
      updatedAt: new Date(1_600),
      deletedAt: null,
      version: 5,
    } as any;

    const state = persistenceDtoToGoalState(dto);

    expect(state.tags).toEqual(['a', 'b']);
    expect(state.reminderConfig?.toDTO().enabled).toBe(true);
    expect(state.keyResults).toHaveLength(1);
    expect(state.keyResults[0].progress.aggregationMethod).toBe('Last');
    expect(state.keyResults[0].progress.currentValue).toBe(0);
    expect(state.goalReviews).toHaveLength(1);
    expect(state.goalReviews[0].keyResultSnapshots).toHaveLength(1);
    expect(state.weightSnapshots).toHaveLength(1);
    expect(state.weightSnapshots[0].toDTO().id).toBe('snapshot-1');
  });

  it('handles array/object inputs and null collections', () => {
    const dto = {
      id: 'goal-2',
      identityId: 'identity-1',
      name: 'Goal2',
      description: 'desc',
      color: '#abcdef',
      feasibilityAnalysis: 'f',
      motivation: 'm',
      status: 'Completed',
      importance: 'High',
      priority: 20,
      category: 'cat',
      tags: ['x'],
      startDate: null,
      targetDate: null,
      completedAt: new Date(3_000),
      archivedAt: null,
      folderId: null,
      parentGoalId: 'goal-1',
      sortOrder: 2,
      reminderConfig: {
        enabled: false,
        triggers: JSON.stringify([]),
      },
      keyResults: [],
      goalReviews: [],
      weightSnapshots: [],
      totalKeyResults: 0,
      completedKeyResults: 0,
      createdAt: new Date(2_000),
      updatedAt: new Date(3_000),
      deletedAt: new Date(3_100),
      version: 1,
    } as any;

    const state = persistenceDtoToGoalState(dto);

    expect(state.tags).toEqual(['x']);
    expect(state.folderId).toBeNull();
    expect(state.parentGoalId).toBe('goal-1');
    expect(state.keyResults).toEqual([]);
    expect(state.goalReviews).toEqual([]);
    expect(state.weightSnapshots).toEqual([]);
    expect(state.deletedAt?.getTime()).toBe(3_100);
  });
});
