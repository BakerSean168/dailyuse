import { beforeEach, describe, expect, it } from 'vitest';
import type {
  FocusModeClientDTO,
  GoalClientDTO,
  GoalFolderClientDTO,
  GoalRecordClientDTO,
  GoalReviewClientDTO,
  KeyResultClientDTO,
} from '@dailyuse/contracts/goal';
import { createTestPinia } from '@dailyuse/test-utils';
import { useGoalStore } from './goalStore';

function createGoal(overrides: Partial<GoalClientDTO> = {}): GoalClientDTO {
  return {
    id: 'goal-1' as GoalClientDTO['id'],
    status: 'Active',
    name: 'Ship oracle',
    archivedAt: null,
    completedAt: null,
    deletedAt: null,
    folderId: null,
    keyResults: [],
    reviews: [],
    ...overrides,
  } as GoalClientDTO;
}

function createKeyResult(
  overrides: Partial<KeyResultClientDTO> = {},
): KeyResultClientDTO {
  return {
    id: 'kr-1' as KeyResultClientDTO['id'],
    title: 'Add store tests',
    ...overrides,
  } as KeyResultClientDTO;
}

describe('useGoalStore', () => {
  beforeEach(() => {
    createTestPinia();
  });

  it('keeps goal list filters, counts, and current goal in sync', () => {
    const store = useGoalStore();
    const active = createGoal();
    const completed = createGoal({
      id: 'goal-2' as GoalClientDTO['id'],
      status: 'Archived',
      archivedAt: Date.now(),
      completedAt: Date.now(),
    });

    store.setGoals([completed], 21);
    store.addGoal(active);
    store.setCurrentGoal(active);
    store.updateGoal({
      ...active,
      name: 'Ship stronger oracle',
    });
    store.setSelectedFolderId('folder-1');
    store.setSearchQuery('oracle');
    store.setSystemView('completed');

    expect(store.getGoalById(active.id)?.name).toBe('Ship stronger oracle');
    expect(store.getGoalsByStatus('Archived')).toHaveLength(1);
    expect(store.activeGoalCount).toBe(1);
    expect(store.completedGoalCount).toBe(1);
    expect(store.totalPages).toBe(2);
    expect(store.hasActiveFilter).toBe(true);
    expect(store.pagination.page).toBe(1);

    store.removeGoal(active.id);
    expect(store.currentGoal).toBeNull();
    expect(store.pagination.total).toBe(21);
  });

  it('syncs child entities, folders, focus mode, and reset state', () => {
    const store = useGoalStore();
    const goal = createGoal({ keyResults: [], reviews: [] });
    const keyResult = createKeyResult();
    const updatedKeyResult = createKeyResult({
      id: keyResult.id,
      title: 'Expanded coverage',
    });
    const review = {
      id: 'review-1',
      summary: 'Good progress',
    } as GoalReviewClientDTO;
    const folder = {
      id: 'folder-1',
      name: 'Testing',
    } as GoalFolderClientDTO;
    const record = {
      id: 'record-1',
    } as GoalRecordClientDTO;
    const focusMode = {
      id: 'focus-1',
      isActive: true,
    } as FocusModeClientDTO;

    store.setCurrentGoal(goal);
    store.setKeyResults([keyResult]);
    store.updateKeyResult(updatedKeyResult);
    store.addGoalReview(review);
    store.setGoalFolders([folder]);
    store.addGoalFolder({ id: 'folder-2', name: 'More' } as GoalFolderClientDTO);
    store.updateGoalFolder({ id: 'folder-2', name: 'More tests' } as GoalFolderClientDTO);
    store.removeGoalFolder('folder-1');
    store.setGoalRecords([record]);
    store.addGoalRecord({ id: 'record-2' } as GoalRecordClientDTO);
    store.setCurrentFocusMode(focusMode);
    store.setError('failed');
    store.setLoading(true);
    store.setInitialized(true);
    store.clearFilters();
    store.setPageSize(50);

    expect(store.keyResults[0]?.title).toBe('Expanded coverage');
    expect(store.currentGoal?.keyResults?.[0]?.title).toBe('Expanded coverage');
    expect(store.goalReviews).toEqual([review]);
    expect(store.currentGoal?.reviews).toEqual([review]);
    expect(store.goalFolders.map((item) => item.id)).toEqual(['folder-2']);
    expect(store.goalRecords).toHaveLength(2);
    expect(store.currentFocusMode).toStrictEqual(focusMode);
    expect(store.error).toBe('failed');
    expect(store.isLoading).toBe(true);
    expect(store.pagination.pageSize).toBe(50);
    expect(store.pagination.page).toBe(1);

    store.removeKeyResult(keyResult.id);
    expect(store.keyResults).toEqual([]);

    store.reset();
    expect(store.goals).toEqual([]);
    expect(store.currentGoal).toBeNull();
    expect(store.currentFocusMode).toBeNull();
    expect(store.isInitialized).toBe(false);
  });
});
