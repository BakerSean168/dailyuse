import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@dailyuse/test-utils/helpers/result-matchers';
import { createMockRepo } from '@dailyuse/test-utils/mocks';
import type { IGoalRepository } from '@/server/domain/repositories/i-goal-repository';
import { Goal, GoalPolicy } from '@/server/domain';
import { ActivateGoalUseCase } from '../activate-goal.use-case';

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

describe('ActivateGoalUseCase', () => {
  let goalRepo: ReturnType<typeof createMockRepo<IGoalRepository>>;
  let useCase: ActivateGoalUseCase;

  beforeEach(() => {
    vi.clearAllMocks();
    goalRepo = createMockRepo<IGoalRepository>({
      findByIdForIdentity: vi.fn(),
      save: vi.fn().mockResolvedValue(undefined),
    });
    useCase = new ActivateGoalUseCase(goalRepo, new GoalPolicy());
  });

  it('should return NOT_FOUND when goal does not exist', async () => {
    vi.mocked(goalRepo.findByIdForIdentity).mockResolvedValue(null);

    const result = await useCase.execute('non-existent', 'identity-1');

    expect(result).toBeErrorWithCode('NOT_FOUND');
    expect(goalRepo.save).not.toHaveBeenCalled();
  });

  it('should reject activating a completed goal', async () => {
    const goal = createTestGoal();
    goal.markAsCompleted();
    vi.mocked(goalRepo.findByIdForIdentity).mockResolvedValue(goal);

    const result = await useCase.execute(goal.id, 'identity-1');

    expect(result).toBeErrorWithCode('INVALID_STATE');
    expect(goalRepo.save).not.toHaveBeenCalled();
  });

  it('should activate an already active goal (idempotent)', async () => {
    const goal = createTestGoal();
    vi.mocked(goalRepo.findByIdForIdentity).mockResolvedValue(goal);

    const result = await useCase.execute(goal.id, 'identity-1');

    expect(result).toBeOk();
    expect(goal.status).toBe('Active');
  });

  it('should throw when goal is archived', async () => {
    const goal = createTestGoal();
    goal.markAsCompleted();
    goal.archive();
    vi.mocked(goalRepo.findByIdForIdentity).mockResolvedValue(goal);

    const result = await useCase.execute(goal.id, 'identity-1');

    expect(result).toBeErrorWithCode('INVALID_STATE');
  });

  it('should return the goal DTO on success', async () => {
    const goal = createTestGoal('Activate Me');
    vi.mocked(goalRepo.findByIdForIdentity).mockResolvedValue(goal);

    const result = await useCase.execute(goal.id, 'identity-1');

    expect(result).toBeOk();
    if (result.ok) {
      expect(result.data.name).toBe('Activate Me');
      expect(result.data.id).toBe(goal.id);
    }
  });
});
