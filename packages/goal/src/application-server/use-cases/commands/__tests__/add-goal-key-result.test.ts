import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@dailyuse/test-utils/helpers/result-matchers';
import { createMockRepo } from '@dailyuse/test-utils/mocks';
import type { IGoalRepository } from '@/domain-server/repositories/i-goal-repository';
import { Goal, GoalPolicy } from '@/domain-server';
import { AddGoalKeyResult } from '../add-goal-key-result';

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

function aKeyResultInput(overrides: Record<string, any> = {}) {
  return {
    title: 'Read 10 books',
    valueType: 'NUMERIC',
    targetValue: 10,
    currentValue: 0,
    weight: 3,
    ...overrides,
  };
}

describe('AddGoalKeyResult', () => {
  let goalRepo: ReturnType<typeof createMockRepo<IGoalRepository>>;
  let useCase: AddGoalKeyResult;

  beforeEach(() => {
    vi.clearAllMocks();
    goalRepo = createMockRepo<IGoalRepository>({
      findById: vi.fn(),
      save: vi.fn().mockResolvedValue(undefined),
    });
    useCase = new AddGoalKeyResult(goalRepo, new GoalPolicy());
  });

  it('should return NOT_FOUND when goal does not exist', async () => {
    vi.mocked(goalRepo.findById).mockResolvedValue(null);

    const result = await useCase.execute('non-existent', aKeyResultInput());

    expect(result).toBeErrorWithCode('NOT_FOUND');
    expect(goalRepo.save).not.toHaveBeenCalled();
  });

  it('should add a key result to an active goal', async () => {
    const goal = createTestGoal();
    vi.mocked(goalRepo.findById).mockResolvedValue(goal);

    const result = await useCase.execute(goal.id, aKeyResultInput());

    expect(result).toBeOk();
    expect(goal.keyResults).toHaveLength(1);
    expect(goal.keyResults[0].title).toBe('Read 10 books');
    expect(goalRepo.save).toHaveBeenCalledWith(goal);
  });

  it('should throw when goal is archived', async () => {
    const goal = createTestGoal();
    goal.markAsCompleted();
    goal.archive();
    vi.mocked(goalRepo.findById).mockResolvedValue(goal);

    await expect(useCase.execute(goal.id, aKeyResultInput())).rejects.toThrow();
  });

  it('should validate key result weight', async () => {
    const goal = createTestGoal();
    vi.mocked(goalRepo.findById).mockResolvedValue(goal);

    await expect(useCase.execute(goal.id, aKeyResultInput({ weight: 0 }))).rejects.toThrow();
  });

  it('should reject weight exceeding 5', async () => {
    const goal = createTestGoal();
    vi.mocked(goalRepo.findById).mockResolvedValue(goal);

    await expect(useCase.execute(goal.id, aKeyResultInput({ weight: 6 }))).rejects.toThrow();
  });

  it('should return the goal DTO with children on success', async () => {
    const goal = createTestGoal('Goal with KR');
    vi.mocked(goalRepo.findById).mockResolvedValue(goal);

    const result = await useCase.execute(goal.id, aKeyResultInput({ title: 'My KR' }));

    expect(result).toBeOk();
    if (result.ok) {
      expect(result.data.name).toBe('Goal with KR');
      expect(result.data.keyResults).toBeDefined();
    }
  });

  it('should allow adding multiple key results', async () => {
    const goal = createTestGoal();
    vi.mocked(goalRepo.findById).mockResolvedValue(goal);

    await useCase.execute(goal.id, aKeyResultInput({ title: 'KR1' }));
    await useCase.execute(goal.id, aKeyResultInput({ title: 'KR2' }));

    expect(goal.keyResults).toHaveLength(2);
  });
});
