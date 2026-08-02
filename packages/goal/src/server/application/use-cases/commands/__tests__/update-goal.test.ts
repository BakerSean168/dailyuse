import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@memoflow/test-utils/helpers/result-matchers';
import { createMockRepo } from '@memoflow/test-utils/mocks';
import type { IGoalRepository } from '../../../../domain/repositories/i-goal-repository';
import { Goal, GoalPolicy } from '../../../../domain';
import { UpdateGoalUseCase } from '../update-goal.use-case';

// ============================================================
// Helpers
// ============================================================

function createTestGoal(name = 'Original Goal'): Goal {
  return Goal.create({
    identityId: 'test-identity-id' as any,
    name,
    description: null,
    color: '#3B82F6',
    feasibilityAnalysis: null,
    motivation: null,
    importance: 'MEDIUM' as any,
    category: null,
    tags: [],
    startDate: null,
    targetDate: null,
    folderId: null,
    parentGoalId: null,
    reminderConfig: null,
  });
}

describe('UpdateGoalUseCase', () => {
  let goalRepo: ReturnType<typeof createMockRepo<IGoalRepository>>;
  let useCase: UpdateGoalUseCase;

  beforeEach(() => {
    vi.clearAllMocks();
    goalRepo = createMockRepo<IGoalRepository>({
      findByIdForIdentity: vi.fn(),
      save: vi.fn().mockResolvedValue(undefined),
      saveRootWithExpectedVersion: vi.fn().mockResolvedValue(undefined),
    });
    useCase = new UpdateGoalUseCase(goalRepo, new GoalPolicy());
  });

  it('should return NOT_FOUND when goal does not exist', async () => {
    vi.mocked(goalRepo.findByIdForIdentity).mockResolvedValue(null);

    const result = await useCase.execute('non-existent', 'identity-1', {
      name: 'Updated',
      expectedVersion: 1,
    });

    expect(result).toBeErrorWithCode('NOT_FOUND');
    expect(goalRepo.saveRootWithExpectedVersion).not.toHaveBeenCalled();
  });

  it('should update the goal name', async () => {
    const goal = createTestGoal();
    vi.mocked(goalRepo.findByIdForIdentity).mockResolvedValue(goal);

    const result = await useCase.execute(goal.id, 'identity-1', {
      name: 'Updated Title',
      expectedVersion: 1,
    });

    expect(result).toBeOk();
    expect(goal.name).toBe('Updated Title');
    expect(goalRepo.saveRootWithExpectedVersion).toHaveBeenCalledTimes(1);
    if (result.ok) {
      expect(result.data).toEqual(
        expect.objectContaining({
          goalId: goal.id,
          goalVersion: 2,
          affectedEntityIds: expect.objectContaining({ goalIds: [goal.id] }),
          readModel: expect.objectContaining({ id: goal.id, name: 'Updated Title', version: 2 }),
        }),
      );
    }
  });

  it('should update tags when provided', async () => {
    const goal = createTestGoal();
    vi.mocked(goalRepo.findByIdForIdentity).mockResolvedValue(goal);

    const result = await useCase.execute(goal.id, 'identity-1', {
      tags: ['new-tag'],
      expectedVersion: 1,
    });

    expect(result).toBeOk();
    expect(goal.tags).toEqual(['new-tag']);
  });

  it('reconciles root and key-result edits in one aggregate save', async () => {
    const goal = createTestGoal();
    const existing = goal.createAndAddKeyResult({
      title: 'Old KR',
      valueType: 'Incremental',
      aggregationMethod: 'Sum',
      targetValue: 10,
      weight: 1,
    });
    goal.advanceVersion();
    vi.mocked(goalRepo.findByIdForIdentity).mockResolvedValue(goal);

    const result = await useCase.execute(goal.id, 'identity-1', {
      expectedVersion: 2,
      name: 'Updated goal and KRs',
      keyResults: [
        {
          id: existing.id,
          title: 'Updated KR',
          valueType: 'Percentage',
          calculationMethod: 'Last',
          startValue: 0,
          currentValue: 25,
          targetValue: 100,
          weight: 3,
        },
        {
          title: 'New KR',
          valueType: 'Binary',
          calculationMethod: 'Last',
          targetValue: 1,
          weight: 2,
        },
      ],
    });

    expect(result).toBeOk();
    expect(goal.name).toBe('Updated goal and KRs');
    expect(goal.getAllKeyResults()).toHaveLength(2);
    expect(goal.getKeyResult(String(existing.id))?.title).toBe('Updated KR');
    expect(goal.getKeyResult(String(existing.id))?.progress.valueType).toBe('Percentage');
    expect(goalRepo.saveRootWithExpectedVersion).toHaveBeenCalledOnce();
    expect(goalRepo.saveRootWithExpectedVersion).toHaveBeenCalledWith(goal, 2);
  });

  it('rejects a foreign key-result ID before saving any aggregate changes', async () => {
    const goal = createTestGoal();
    vi.mocked(goalRepo.findByIdForIdentity).mockResolvedValue(goal);

    const result = await useCase.execute(goal.id, 'identity-1', {
      expectedVersion: 1,
      keyResults: [
        {
          id: 'foreign-kr' as any,
          title: 'Foreign',
          valueType: 'Incremental',
          calculationMethod: 'Sum',
          targetValue: 10,
          weight: 1,
        },
      ],
    });

    expect(result).toBeErrorWithCode('VALIDATION_ERROR');
    expect(goalRepo.saveRootWithExpectedVersion).not.toHaveBeenCalled();
  });

  it('should update time range when dates provided', async () => {
    const goal = createTestGoal();
    vi.mocked(goalRepo.findByIdForIdentity).mockResolvedValue(goal);
    const targetDate = Date.parse('2026-12-31T00:00:00.000Z');

    const result = await useCase.execute(goal.id, 'identity-1', { targetDate, expectedVersion: 1 });

    expect(result).toBeOk();
    expect(goal.targetDate).toBeDefined();
  });

  it('should update folder when folderId provided', async () => {
    const goal = createTestGoal();
    vi.mocked(goalRepo.findByIdForIdentity).mockResolvedValue(goal);

    const result = await useCase.execute(goal.id, 'identity-1', {
      folderId: 'folder-123' as any,
      expectedVersion: 1,
    });

    expect(result).toBeOk();
  });

  it('validates and updates the parent hierarchy in the same versioned write', async () => {
    const goal = createTestGoal();
    const parent = createTestGoal('Parent');
    vi.mocked(goalRepo.findByIdForIdentity).mockImplementation(async (_identityId, id) =>
      id === String(goal.id) ? goal : id === String(parent.id) ? parent : null,
    );
    vi.mocked(goalRepo.isAncestor).mockResolvedValue(false);

    const result = await useCase.execute(goal.id, 'identity-1', {
      parentGoalId: parent.id,
      expectedVersion: 1,
    });

    expect(result).toBeOk();
    expect(goal.parentGoalId).toBe(parent.id);
    expect(goalRepo.saveRootWithExpectedVersion).toHaveBeenCalledWith(goal, 1);
  });

  it('rejects a parent that is already a descendant without writing', async () => {
    const goal = createTestGoal();
    const descendant = createTestGoal('Descendant');
    vi.mocked(goalRepo.findByIdForIdentity).mockImplementation(async (_identityId, id) =>
      id === String(goal.id) ? goal : descendant,
    );
    vi.mocked(goalRepo.isAncestor).mockResolvedValue(true);

    const result = await useCase.execute(goal.id, 'identity-1', {
      parentGoalId: descendant.id,
      expectedVersion: 1,
    });

    expect(result).toBeErrorWithCode('VALIDATION_ERROR');
    expect(goalRepo.saveRootWithExpectedVersion).not.toHaveBeenCalled();
  });

  it('should throw when goal is archived', async () => {
    const goal = createTestGoal();
    goal.markAsCompleted();
    goal.archive();
    vi.mocked(goalRepo.findByIdForIdentity).mockResolvedValue(goal);

    await expect(
      useCase.execute(goal.id, 'identity-1', { name: 'Should fail', expectedVersion: 1 }),
    ).rejects.toThrow();
  });

  it('returns a conflict without writing for a stale expected version', async () => {
    const goal = createTestGoal();
    vi.mocked(goalRepo.findByIdForIdentity).mockResolvedValue(goal);

    const result = await useCase.execute(goal.id, 'identity-1', {
      name: 'New Name',
      expectedVersion: goal.version + 1,
    });

    expect(result).toBeErrorWithCode('CONFLICT');
    expect(goalRepo.saveRootWithExpectedVersion).not.toHaveBeenCalled();
  });

  it('should save the goal after update with its expected version', async () => {
    const goal = createTestGoal();
    vi.mocked(goalRepo.findByIdForIdentity).mockResolvedValue(goal);

    await useCase.execute(goal.id, 'identity-1', { name: 'New Name', expectedVersion: 1 });

    expect(goalRepo.saveRootWithExpectedVersion).toHaveBeenCalledWith(goal, 1);
    expect(goal.version).toBe(2);
  });
});
