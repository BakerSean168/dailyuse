import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@memoflow/test-utils/helpers/result-matchers';
import { createMockRepo } from '@memoflow/test-utils/mocks';
import type { IGoalRepository } from '../../../../domain/repositories/i-goal-repository';
import { Goal, GoalPolicy } from '../../../../domain';
import { ArchiveGoalUseCase } from '../archive-goal.use-case';

// ============================================================
// Helpers
// ============================================================

function createTestGoal(name = 'Test Goal'): Goal {
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

function createCompletedGoal(name = 'Completed Goal'): Goal {
  const goal = createTestGoal(name);
  goal.markAsCompleted();
  return goal;
}

describe('ArchiveGoalUseCase', () => {
  let goalRepo: ReturnType<typeof createMockRepo<IGoalRepository>>;
  let useCase: ArchiveGoalUseCase;

  beforeEach(() => {
    vi.clearAllMocks();
    goalRepo = createMockRepo<IGoalRepository>({
      findByIdForIdentity: vi.fn(),
      save: vi.fn().mockResolvedValue(undefined),
      saveRootWithExpectedVersion: vi.fn().mockResolvedValue(undefined),
    });
    useCase = new ArchiveGoalUseCase(goalRepo, new GoalPolicy());
  });

  it('should return NOT_FOUND when goal does not exist', async () => {
    vi.mocked(goalRepo.findByIdForIdentity).mockResolvedValue(null);

    const result = await useCase.execute('non-existent', 'identity-1', 1);

    expect(result).toBeErrorWithCode('NOT_FOUND');
    expect(goalRepo.save).not.toHaveBeenCalled();
  });

  it('should reject archiving a completed goal again', async () => {
    const goal = createCompletedGoal();
    vi.mocked(goalRepo.findByIdForIdentity).mockResolvedValue(goal);

    await expect(useCase.execute(goal.id, 'identity-1', goal.version)).rejects.toThrow();
  });

  it('should archive an active goal', async () => {
    const goal = createTestGoal();
    vi.mocked(goalRepo.findByIdForIdentity).mockResolvedValue(goal);

    const result = await useCase.execute(goal.id, 'identity-1', goal.version);

    expect(result).toBeOk();
    expect(goal.archivedAt).not.toBeNull();
    expect(goal.completedAt).toBeNull();
    expect(goalRepo.findByIdForIdentity).toHaveBeenCalledWith('identity-1', goal.id, {
      includeChildren: true,
    });
    expect(goalRepo.saveRootWithExpectedVersion).toHaveBeenCalledWith(goal, 1);
  });

  it('should throw when goal is already archived', async () => {
    const goal = createCompletedGoal();
    goal.archive();
    vi.mocked(goalRepo.findByIdForIdentity).mockResolvedValue(goal);

    await expect(useCase.execute(goal.id, 'identity-1', goal.version)).rejects.toThrow();
  });

  it('should return the goal DTO on success', async () => {
    const goal = createTestGoal('Archive Me');
    vi.mocked(goalRepo.findByIdForIdentity).mockResolvedValue(goal);

    const result = await useCase.execute(goal.id, 'identity-1', goal.version);

    expect(result).toBeOk();
    if (result.ok) {
      expect(result.data.readModel.name).toBe('Archive Me');
      expect(result.data.readModel.id).toBe(goal.id);
      expect(result.data.readModel.archivedAt).not.toBeNull();
    }
  });

  it('rejects a stale version before archiving', async () => {
    const goal = createTestGoal();
    vi.mocked(goalRepo.findByIdForIdentity).mockResolvedValue(goal);

    const result = await useCase.execute(goal.id, 'identity-1', goal.version + 1);

    expect(result).toBeErrorWithCode('CONFLICT');
    expect(goal.archivedAt).toBeNull();
    expect(goalRepo.saveRootWithExpectedVersion).not.toHaveBeenCalled();
  });
});
