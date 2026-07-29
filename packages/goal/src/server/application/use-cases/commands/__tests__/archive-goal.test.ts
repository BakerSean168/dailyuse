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
    });
    useCase = new ArchiveGoalUseCase(goalRepo, new GoalPolicy());
  });

  it('should return NOT_FOUND when goal does not exist', async () => {
    vi.mocked(goalRepo.findByIdForIdentity).mockResolvedValue(null);

    const result = await useCase.execute('non-existent', 'identity-1');

    expect(result).toBeErrorWithCode('NOT_FOUND');
    expect(goalRepo.save).not.toHaveBeenCalled();
  });

  it('should reject archiving a completed goal again', async () => {
    const goal = createCompletedGoal();
    vi.mocked(goalRepo.findByIdForIdentity).mockResolvedValue(goal);

    await expect(useCase.execute(goal.id, 'identity-1')).rejects.toThrow();
  });

  it('should archive an active goal', async () => {
    const goal = createTestGoal();
    vi.mocked(goalRepo.findByIdForIdentity).mockResolvedValue(goal);

    const result = await useCase.execute(goal.id, 'identity-1');

    expect(result).toBeOk();
    expect(goal.archivedAt).not.toBeNull();
    expect(goal.completedAt).toBeNull();
  });

  it('should throw when goal is already archived', async () => {
    const goal = createCompletedGoal();
    goal.archive();
    vi.mocked(goalRepo.findByIdForIdentity).mockResolvedValue(goal);

    await expect(useCase.execute(goal.id, 'identity-1')).rejects.toThrow();
  });

  it('should return the goal DTO on success', async () => {
    const goal = createTestGoal('Archive Me');
    vi.mocked(goalRepo.findByIdForIdentity).mockResolvedValue(goal);

    const result = await useCase.execute(goal.id, 'identity-1');

    expect(result).toBeOk();
    if (result.ok) {
      expect(result.data.name).toBe('Archive Me');
      expect(result.data.id).toBe(goal.id);
      expect(result.data.archivedAt).not.toBeNull();
    }
  });
});
