import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockRepo } from '@memoflow/test-utils/mocks';
import type { IGoalRepository } from '../../../../domain/repositories/i-goal-repository';
import { Goal, GoalPolicy } from '../../../../domain';
import { CompleteGoalUseCase } from '../complete-goal.use-case';

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

describe('CompleteGoalUseCase', () => {
  let goalRepo: ReturnType<typeof createMockRepo<IGoalRepository>>;
  let useCase: CompleteGoalUseCase;

  beforeEach(() => {
    vi.clearAllMocks();
    goalRepo = createMockRepo<IGoalRepository>({
      findByIdForIdentity: vi.fn(),
      save: vi.fn().mockResolvedValue(undefined),
      saveRootWithExpectedVersion: vi.fn().mockResolvedValue(undefined),
    });
    useCase = new CompleteGoalUseCase(goalRepo, new GoalPolicy());
  });

  it('should return error when goal does not exist', async () => {
    vi.mocked(goalRepo.findByIdForIdentity).mockResolvedValue(null);

    const result = await useCase.execute('non-existent', 'identity-1', 1);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('NOT_FOUND');
      expect(result.error.message).toContain('Goal not found');
    }
  });

  it('should complete an active goal', async () => {
    const goal = createTestGoal();
    vi.mocked(goalRepo.findByIdForIdentity).mockResolvedValue(goal);

    const result = await useCase.execute(goal.id, 'identity-1', goal.version);

    expect(result.ok).toBe(true);
    expect(goal.status).toBe('Archived');
    expect(goal.completedAt).not.toBeNull();
    expect(goal.archivedAt).not.toBeNull();
    expect(goalRepo.findByIdForIdentity).toHaveBeenCalledWith('identity-1', goal.id, {
      includeChildren: true,
    });
    expect(goalRepo.saveRootWithExpectedVersion).toHaveBeenCalledWith(goal, 1);
    if (result.ok) {
      expect(result.data.readModel).toBeDefined();
      expect(result.data.readModel.name).toBe('Test Goal');
    }
  });

  it('should be idempotent for already completed goals', async () => {
    const goal = createTestGoal();
    goal.markAsCompleted();
    vi.mocked(goalRepo.findByIdForIdentity).mockResolvedValue(goal);

    const result = await useCase.execute(goal.id, 'identity-1', goal.version);

    expect(result.ok).toBe(true);
    expect(goal.status).toBe('Archived');
    if (result.ok) {
      expect(result.data.readModel).toBeDefined();
    }
  });

  it('should return ok when goal is archived', async () => {
    const goal = createTestGoal();
    goal.markAsCompleted();
    goal.archive();
    vi.mocked(goalRepo.findByIdForIdentity).mockResolvedValue(goal);

    const result = await useCase.execute(goal.id, 'identity-1', goal.version);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.readModel.status).toBe('Archived');
    }
  });

  it('should return the client read model with children', async () => {
    const goal = createTestGoal('Complete Me');
    goal.createAndAddKeyResult({
      title: 'KR1',
      valueType: 'NUMERIC',
      targetValue: 100,
      weight: 3,
    });
    vi.mocked(goalRepo.findByIdForIdentity).mockResolvedValue(goal);

    const result = await useCase.execute(goal.id, 'identity-1', goal.version);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.readModel.name).toBe('Complete Me');
      expect(result.data.readModel.status).toBe('Archived');
    }
  });
});
