import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockRepo } from '@dailyuse/test-utils/mocks';
import type { IGoalRepository } from '@/domain-server/repositories/i-goal-repository';
import { Goal, GoalPolicy } from '@/domain-server';
import { CompleteGoal } from '../complete-goal';

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

describe('CompleteGoal', () => {
  let goalRepo: ReturnType<typeof createMockRepo<IGoalRepository>>;
  let useCase: CompleteGoal;

  beforeEach(() => {
    vi.clearAllMocks();
    goalRepo = createMockRepo<IGoalRepository>({
      findById: vi.fn(),
      save: vi.fn().mockResolvedValue(undefined),
    });
    useCase = new CompleteGoal(goalRepo, new GoalPolicy());
  });

  it('should throw when goal does not exist', async () => {
    vi.mocked(goalRepo.findById).mockResolvedValue(null);

    await expect(useCase.execute('non-existent')).rejects.toThrow('Goal not found');
  });

  it('should complete an active goal', async () => {
    const goal = createTestGoal();
    vi.mocked(goalRepo.findById).mockResolvedValue(goal);

    const result = await useCase.execute(goal.id);

    expect(goal.status).toBe('Completed');
    expect(goalRepo.save).toHaveBeenCalledWith(goal);
    expect(result.goal).toBeDefined();
    expect(result.goal.name).toBe('Test Goal');
  });

  it('should be idempotent for already completed goals', async () => {
    const goal = createTestGoal();
    goal.markAsCompleted();
    vi.mocked(goalRepo.findById).mockResolvedValue(goal);

    const result = await useCase.execute(goal.id);

    expect(goal.status).toBe('Completed');
    expect(result.goal).toBeDefined();
  });

  it('should throw when goal is archived', async () => {
    const goal = createTestGoal();
    goal.markAsCompleted();
    goal.archive();
    vi.mocked(goalRepo.findById).mockResolvedValue(goal);

    await expect(useCase.execute(goal.id)).rejects.toThrow();
  });

  it('should return the server DTO with includeChildren', async () => {
    const goal = createTestGoal('Complete Me');
    goal.createAndAddKeyResult({
      title: 'KR1',
      valueType: 'NUMERIC',
      targetValue: 100,
      weight: 3,
    });
    vi.mocked(goalRepo.findById).mockResolvedValue(goal);

    const result = await useCase.execute(goal.id);

    expect(result.goal.name).toBe('Complete Me');
    expect(result.goal.status).toBe('Completed');
  });
});
