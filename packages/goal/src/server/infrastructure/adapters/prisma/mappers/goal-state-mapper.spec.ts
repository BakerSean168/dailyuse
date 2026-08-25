import { describe, it, expect } from 'vitest';
import { aPrefixedUuid } from '@memoflow/test-utils/fixtures';
import { rawDataToGoalState } from './goal-state-mapper';

describe('rawDataToGoalState', () => {
  const GOAL_ID_1 = aPrefixedUuid('IGoalId', 'goal-state-goal-1');
  const GOAL_ID_2 = aPrefixedUuid('IGoalId', 'goal-state-goal-2');
  const IDENTITY_ID_1 = aPrefixedUuid('IdentityId', 'goal-state-owner-1');
  const KEY_RESULT_ID_1 = aPrefixedUuid('IKeyResultId', 'goal-state-kr-1');
  const REVIEW_ID_1 = aPrefixedUuid('IGoalReviewId', 'goal-state-review-1');
  const SNAPSHOT_ID_1 = aPrefixedUuid('IKeyResultWeightSnapshotId', 'goal-state-snapshot-1');

  it('parses structured fields and maps nested entities', () => {
    const raw = {
      id: GOAL_ID_1,
      identityId: IDENTITY_ID_1,
      name: 'Goal',
      description: null,
      feasibilityAnalysis: null,
      motivation: null,
      status: 'Active',
      startDate: new Date(1_000),
      dueDate: new Date(2_000),
      completedAt: null,
      archivedAt: null,
      sortOrder: 1,
      reminderConfig: {
        enabled: true,
        triggers: [{ type: 'RemainingDays', value: 3, enabled: true }],
      },
      keyResults: [
        {
          id: KEY_RESULT_ID_1,
          goalId: GOAL_ID_1,
          title: 'KR',
          description: null,
          progress: {
            initialValue: 0,
            currentValue: 0,
            targetValue: 100,
            valueType: 'Incremental',
            aggregationMethod: 'Last',
            unit: null,
          },
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
          id: REVIEW_ID_1,
          goalId: GOAL_ID_1,
          type: 'Weekly',
          rating: 4,
          summary: 'ok',
          achievements: null,
          challenges: null,
          improvements: null,
          keyResultSnapshots: [],
          reviewedAt: new Date(1_200),
          version: 1,
          createdAt: new Date(1_200),
          updatedAt: new Date(1_300),
          deletedAt: null,
        },
      ],
      weightSnapshots: [
        {
          id: SNAPSHOT_ID_1 as any,
          goalId: GOAL_ID_1 as any,
          keyResultId: KEY_RESULT_ID_1 as any,
          identityId: IDENTITY_ID_1 as any,
          oldWeight: 1,
          newWeight: 2,
          weightDelta: 1,
          snapshotTime: 1_111,
          trigger: 'Manual',
          reason: null,
          operatorId: IDENTITY_ID_1 as any,
          createdAt: 1_112,
        },
      ],
      totalKeyResults: 1,
      completedKeyResults: 0,
      createdAt: new Date(900),
      updatedAt: new Date(1_600),
      deletedAt: null,
      version: 5,
    };

    const state = rawDataToGoalState(raw);

    expect(state.dueDate).toBe(2_000);
    expect('tags' in state).toBe(false);
    expect('folderId' in state).toBe(false);
    expect('parentGoalId' in state).toBe(false);
    expect(state.reminderConfig?.toDTO().enabled).toBe(true);
    expect(state.keyResults).toHaveLength(1);
    expect(state.keyResults[0].progress.aggregationMethod).toBe('Last');
    expect(state.keyResults[0].progress.currentValue).toBe(0);
    expect(state.goalReviews).toHaveLength(1);
    expect(state.goalReviews[0].keyResultSnapshots).toHaveLength(0);
    expect(state.weightSnapshots).toHaveLength(1);
    expect(state.weightSnapshots[0].toDTO().id).toBe(SNAPSHOT_ID_1);
  });

  it('handles null collections', () => {
    const raw = {
      id: GOAL_ID_2,
      identityId: IDENTITY_ID_1,
      name: 'Goal2',
      description: 'desc',
      feasibilityAnalysis: 'f',
      motivation: 'm',
      status: 'Completed',
      startDate: null,
      dueDate: null,
      completedAt: new Date(3_000),
      archivedAt: null,
      sortOrder: 2,
      reminderConfig: {
        enabled: false,
        triggers: [],
      },
      keyResults: null,
      goalReviews: null,
      weightSnapshots: null,
      totalKeyResults: 0,
      completedKeyResults: 0,
      createdAt: 2_000,
      updatedAt: 3_000,
      deletedAt: 3_100,
      version: 1,
    };

    const state = rawDataToGoalState(raw);

    expect(state.dueDate).toBeNull();
    expect('category' in state).toBe(false);
    expect('importance' in state).toBe(false);
    expect(state.keyResults).toEqual([]);
    expect(state.goalReviews).toEqual([]);
    expect(state.weightSnapshots).toEqual([]);
    expect(state.deletedAt).toBe(3_100);
  });
});
