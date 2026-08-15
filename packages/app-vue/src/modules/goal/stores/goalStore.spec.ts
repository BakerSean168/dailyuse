import { beforeEach, describe, expect, it } from 'vitest';
import type {
  FocusModeDTO,
  GoalAggregateReadModel,
  GoalClientDTO,
  GoalFolderClientDTO,
  GoalRecordClientDTO,
  GoalReviewClientDTO,
  KeyResultClientDTO,
} from '@memoflow/contracts/goal';
import { createTestPinia } from '@memoflow/test-utils';
import { useGoalStore } from './goal-store';

function createGoal(overrides: Partial<GoalAggregateReadModel> = {}): GoalAggregateReadModel {
  return {
    id: 'goal-1' as GoalClientDTO['id'],
    status: 'Active',
    name: 'Ship oracle',
    archivedAt: null,
    completedAt: null,
    deletedAt: null,
    folderId: null,
    version: 1,
    keyResults: [],
    reviews: [],
    totalKeyResults: 0,
    completedKeyResults: 0,
    overallProgress: 0,
    ...overrides,
  } as GoalAggregateReadModel;
}

function createKeyResult(overrides: Partial<KeyResultClientDTO> = {}): KeyResultClientDTO {
  return {
    id: 'kr-1' as KeyResultClientDTO['id'],
    goalId: 'goal-1' as KeyResultClientDTO['goalId'],
    title: 'Add store tests',
    ...overrides,
  } as KeyResultClientDTO;
}

describe('useGoalStore', () => {
  beforeEach(() => {
    createTestPinia();
  });

  it('keeps goal list filters, counts, and selected goal id in sync', () => {
    const store = useGoalStore();
    const active = createGoal();
    const completed = createGoal({
      id: 'goal-2' as GoalClientDTO['id'],
      status: 'Archived',
      archivedAt: Date.now(),
      completedAt: Date.now(),
    });

    store.setGoals([completed], 21);
    store.applyGoalMutationReceipt({
      goalId: active.id,
      goalVersion: active.version,
      affectedEntityIds: { goalIds: [active.id], keyResultIds: [], recordIds: [], reviewIds: [] },
      readModel: active,
    });
    store.selectGoal(active.id);
    store.applyGoalMutationReceipt({
      goalId: active.id,
      goalVersion: 2,
      affectedEntityIds: { goalIds: [active.id], keyResultIds: [], recordIds: [], reviewIds: [] },
      readModel: { ...active, name: 'Ship stronger oracle', version: 2 },
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
    expect(store.selectedGoal).toBeNull();
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
    } as FocusModeDTO;

    store.upsertGoal(goal);
    store.selectGoal(goal.id);
    store.setKeyResults(goal.id, [keyResult], goal.version);
    store.setKeyResults(goal.id, [updatedKeyResult], goal.version);
    store.setGoalReviews([review]);
    store.setGoalFolders([folder]);
    store.addGoalFolder({ id: 'folder-2', name: 'More' } as GoalFolderClientDTO);
    store.updateGoalFolder({ id: 'folder-2', name: 'More tests' } as GoalFolderClientDTO);
    store.removeGoalFolder('folder-1');
    store.setGoalRecords([record, { id: 'record-2' } as GoalRecordClientDTO]);
    store.setCurrentFocusMode(focusMode);
    store.setError('failed');
    store.setLoading(true);
    store.setInitialized(true);
    store.clearFilters();
    store.setPageSize(50);

    expect(store.keyResults[0]?.title).toBe('Expanded coverage');
    expect(store.getKeyResultById(keyResult.id)?.title).toBe('Expanded coverage');
    expect(store.selectedGoal?.keyResults?.[0]?.title).toBe('Expanded coverage');
    expect(store.goalById[goal.id]?.keyResults).toBeUndefined();
    expect(store.goalReviews).toEqual([review]);
    expect(store.goalFolders.map((item) => item.id)).toEqual(['folder-2']);
    expect(store.goalRecords).toHaveLength(2);
    expect(store.currentFocusMode).toStrictEqual(focusMode);
    expect(store.error).toBe('failed');
    expect(store.isLoading).toBe(true);
    expect(store.pagination.pageSize).toBe(50);
    expect(store.pagination.page).toBe(1);

    store.setKeyResults(goal.id, [], goal.version);
    expect(store.keyResults).toEqual([]);

    store.reset();
    expect(store.goals).toEqual([]);
    expect(store.selectedGoal).toBeNull();
    expect(store.currentFocusMode).toBeNull();
    expect(store.isInitialized).toBe(false);
  });

  it('uses the Goal root version to reject stale normalized child state', () => {
    const store = useGoalStore();
    store.upsertGoal(createGoal({ name: 'Newer', version: 3 }));
    store.upsertGoal(createGoal({ name: 'Stale', version: 2 }));
    store.setKeyResults('goal-1', [createKeyResult({ title: 'Newer KR' })], 3);
    store.setKeyResults('goal-1', [createKeyResult({ title: 'Stale KR' })], 2);

    expect(store.getGoalById('goal-1')?.name).toBe('Newer');
    expect(store.getKeyResultById('kr-1')?.title).toBe('Newer KR');
  });

  it('applies a mutation receipt as one version-checked normalized update', () => {
    const store = useGoalStore();
    store.setGoals([createGoal({ name: 'Before', version: 1 })]);
    const keyResult = createKeyResult();

    store.applyGoalMutationReceipt({
      goalId: createGoal().id,
      goalVersion: 2,
      affectedEntityIds: {
        goalIds: [createGoal().id],
        keyResultIds: [keyResult.id],
        recordIds: [],
        reviewIds: [],
      },
      readModel: createGoal({ name: 'After', version: 2, keyResults: [keyResult] }),
    });

    expect(store.getGoalById('goal-1')?.name).toBe('After');
    expect(store.getKeyResultById('kr-1')).toEqual(keyResult);

    store.applyGoalMutationReceipt({
      goalId: createGoal().id,
      goalVersion: 1,
      affectedEntityIds: { goalIds: [], keyResultIds: [], recordIds: [], reviewIds: [] },
      readModel: createGoal({ name: 'Malformed receipt', version: 2 }),
    });
    expect(store.getGoalById('goal-1')?.name).toBe('After');
  });

  it('drops dangling normalized references from getters and projections', () => {
    const store = useGoalStore();
    store.setGoals([createGoal()]);
    store.goalIds.push('ghost-goal');
    store.keyResultIdsByGoalId['goal-1'] = ['ghost-kr'];

    const goals = store.goals;
    expect(goals).toHaveLength(1);
    expect(goals[0]?.id).toBe('goal-1');
    expect(goals[0]?.keyResults).toEqual([]);

    store.setGoals([createGoal({ id: 'goal-2', name: 'No KRs' })]);
    expect(store.goals.find((g) => g.id === 'goal-2')?.keyResults).toEqual([]);

    store.selectGoal('goal-2');
    expect(store.keyResults).toEqual([]);

    store.selectGoal('ghost-goal');
    expect(store.selectedGoal).toBeNull();

    store.selectGoal(null);
    expect(store.keyResults).toEqual([]);

    store.selectGoal('goal-1');
    expect(store.keyResults).toEqual([]);
  });

  it('filters goals by folder and matches unknown folders to nothing', () => {
    const store = useGoalStore();
    store.setGoals([createGoal(), createGoal({ id: 'goal-2', folderId: 'folder-a' })]);
    store.goalIds.push('ghost-goal');

    expect(store.getGoalsByFolder('folder-a').map((g) => g.id)).toEqual(['goal-2']);
    expect(store.getGoalsByFolder('folder-missing')).toEqual([]);
  });

  it('ignores mutation receipts whose existing goal version is newer', () => {
    const store = useGoalStore();
    store.setGoals([createGoal({ name: 'Newer', version: 5 })]);

    store.applyGoalMutationReceipt({
      goalId: createGoal().id,
      goalVersion: 3,
      affectedEntityIds: { goalIds: [], keyResultIds: [], recordIds: [], reviewIds: [] },
      readModel: createGoal({ name: 'Stale receipt', version: 3 }),
    });

    expect(store.getGoalById('goal-1')?.name).toBe('Newer');
  });

  it('applies recordChanges by removing and upserting goal records', () => {
    const store = useGoalStore();
    store.setGoalRecords([
      { id: 'record-keep' } as GoalRecordClientDTO,
      { id: 'record-remove' } as GoalRecordClientDTO,
    ]);

    store.applyGoalMutationReceipt({
      goalId: createGoal().id,
      goalVersion: 1,
      affectedEntityIds: { goalIds: [], keyResultIds: [], recordIds: [], reviewIds: [] },
      readModel: createGoal({ version: 1 }),
      recordChanges: {
        removedIds: ['record-remove'] as GoalRecordClientDTO['id'][],
        upserted: [{ id: 'record-upsert' } as GoalRecordClientDTO],
      },
    });

    expect(store.goalRecords.map((r) => r.id)).toEqual(['record-keep', 'record-upsert']);
  });

  it('removes a goal without key results and never deselects unrelated goals', () => {
    const store = useGoalStore();
    store.setGoals([createGoal(), createGoal({ id: 'goal-2', name: 'Other' })]);
    store.selectGoal('goal-2');

    store.removeGoal('goal-1');

    expect(store.goalIds).toEqual(['goal-2']);
    expect(store.selectedGoalId).toBe('goal-2');
  });

  it('leaves folders untouched when updating an unknown folder', () => {
    const store = useGoalStore();
    store.setGoalFolders([{ id: 'folder-1', name: 'Known' } as GoalFolderClientDTO]);

    store.updateGoalFolder({ id: 'folder-unknown', name: 'Ghost' } as GoalFolderClientDTO);

    expect(store.goalFolders.map((f) => f.id)).toEqual(['folder-1']);
  });

  it('preserves one authoritative progress projection across list and detail views', () => {
    const store = useGoalStore();
    store.setGoals([createGoal()]);
    store.selectGoal('goal-1');

    store.applyGoalMutationReceipt({
      goalId: createGoal().id,
      goalVersion: 2,
      affectedEntityIds: {
        goalIds: [createGoal().id],
        keyResultIds: [],
        recordIds: [],
        reviewIds: [],
      },
      readModel: createGoal({
        version: 2,
        totalKeyResults: 3,
        completedKeyResults: 2,
        overallProgress: 73,
      }),
    });

    const projections = [store.goals[0], store.selectedGoal, store.getGoalById('goal-1')];
    expect(
      projections.map((goal) => ({
        total: goal?.totalKeyResults,
        completed: goal?.completedKeyResults,
        progress: goal?.overallProgress,
      })),
    ).toEqual([
      { total: 3, completed: 2, progress: 73 },
      { total: 3, completed: 2, progress: 73 },
      { total: 3, completed: 2, progress: 73 },
    ]);
  });
});
