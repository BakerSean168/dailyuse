import { vi, describe, it, expect } from 'vitest';
import { createMockRepo } from '@dailyuse/test-utils/mocks';
import type { IGoalRepository } from '@/domain-server/repositories/i-goal-repository';
import { UpdateGoalKeyResultProgress } from '../update-goal-key-result-progress';

// ============================================================
// Helpers
// ============================================================

function createGoalFixture(overrides?: Record<string, any>) {
  return {
    id: 'goal-id-1',
    status: 'IN_PROGRESS',
    name: 'Test Goal',
    description: 'Test description',
    keyResults: [{ id: 'kr-1', title: 'Key Result 1', currentValue: 0, targetValue: 100 }],
    updateKeyResultProgress: vi.fn(),
    toClientDTO: vi.fn().mockReturnValue({
      id: 'goal-id-1',
      name: 'Test Goal',
      keyResults: [{ id: 'kr-1', title: 'Key Result 1', currentValue: 50, targetValue: 100 }],
    }),
    ...overrides,
  } as any;
}

describe('UpdateGoalKeyResultProgress', () => {
  it('should update key result progress successfully', async () => {
    const goal = createGoalFixture();
    const goalPolicy = { ensureGoalCanBeModified: vi.fn() } as any;
    const goalRepo = createMockRepo<IGoalRepository>({
      findById: vi.fn().mockResolvedValue(goal),
      save: vi.fn().mockResolvedValue(undefined),
    });
    const useCase = new UpdateGoalKeyResultProgress(goalRepo, goalPolicy);

    const result = await useCase.execute('goal-id-1', 'kr-1', 50);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.id).toBe('goal-id-1');
    }
    expect(goal.updateKeyResultProgress).toHaveBeenCalledWith('kr-1', 50, undefined);
    expect(goalRepo.save).toHaveBeenCalledWith(goal);
    expect(goalPolicy.ensureGoalCanBeModified).toHaveBeenCalledWith(goal);
  });

  it('should pass optional note to updateKeyResultProgress', async () => {
    const goal = createGoalFixture();
    const goalPolicy = { ensureGoalCanBeModified: vi.fn() } as any;
    const goalRepo = createMockRepo<IGoalRepository>({
      findById: vi.fn().mockResolvedValue(goal),
      save: vi.fn().mockResolvedValue(undefined),
    });
    const useCase = new UpdateGoalKeyResultProgress(goalRepo, goalPolicy);

    await useCase.execute('goal-id-1', 'kr-1', 75, 'Good progress this week');

    expect(goal.updateKeyResultProgress).toHaveBeenCalledWith(
      'kr-1',
      75,
      'Good progress this week',
    );
  });

  it('should return NOT_FOUND when goal does not exist', async () => {
    const goalPolicy = { ensureGoalCanBeModified: vi.fn() } as any;
    const goalRepo = createMockRepo<IGoalRepository>({
      findById: vi.fn().mockResolvedValue(null),
      save: vi.fn().mockResolvedValue(undefined),
    });
    const useCase = new UpdateGoalKeyResultProgress(goalRepo, goalPolicy);

    const result = await useCase.execute('non-existent', 'kr-1', 50);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('NOT_FOUND');
    }
    expect(goalRepo.save).not.toHaveBeenCalled();
  });

  it('should throw when policy rejects modification', async () => {
    const goal = createGoalFixture();
    const goalPolicy = {
      ensureGoalCanBeModified: vi.fn().mockImplementation(() => {
        throw new Error('Goal cannot be modified');
      }),
    } as any;
    const goalRepo = createMockRepo<IGoalRepository>({
      findById: vi.fn().mockResolvedValue(goal),
      save: vi.fn().mockResolvedValue(undefined),
    });
    const useCase = new UpdateGoalKeyResultProgress(goalRepo, goalPolicy);

    await expect(useCase.execute('goal-id-1', 'kr-1', 50)).rejects.toThrow(
      'Goal cannot be modified',
    );
    expect(goalRepo.save).not.toHaveBeenCalled();
    expect(goal.updateKeyResultProgress).not.toHaveBeenCalled();
  });

  it('should call findById with includeChildren option', async () => {
    const goal = createGoalFixture();
    const goalPolicy = { ensureGoalCanBeModified: vi.fn() } as any;
    const goalRepo = createMockRepo<IGoalRepository>({
      findById: vi.fn().mockResolvedValue(goal),
      save: vi.fn().mockResolvedValue(undefined),
    });
    const useCase = new UpdateGoalKeyResultProgress(goalRepo, goalPolicy);

    await useCase.execute('goal-id-1', 'kr-1', 50);

    expect(goalRepo.findById).toHaveBeenCalledWith('goal-id-1', { includeChildren: true });
  });

  it('should call toClientDTO with true for includeChildren', async () => {
    const goal = createGoalFixture();
    const goalPolicy = { ensureGoalCanBeModified: vi.fn() } as any;
    const goalRepo = createMockRepo<IGoalRepository>({
      findById: vi.fn().mockResolvedValue(goal),
      save: vi.fn().mockResolvedValue(undefined),
    });
    const useCase = new UpdateGoalKeyResultProgress(goalRepo, goalPolicy);

    await useCase.execute('goal-id-1', 'kr-1', 50);

    expect(goal.toClientDTO).toHaveBeenCalledWith(true);
  });
});
