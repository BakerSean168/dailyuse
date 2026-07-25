import { vi, describe, it, expect } from 'vitest';
import { createMockRepo } from '@dailyuse/test-utils/mocks';
import type { IGoalRepository } from '@/server/domain/repositories/i-goal-repository';
import { UpdateGoalKeyResultUseCase } from '../update-goal-key-result.use-case';

// ============================================================
// Helpers
// ============================================================

function createGoalFixture(overrides?: Record<string, any>) {
  const keyResult1 = {
    id: 'kr-1',
    title: 'Key Result 1',
    weight: 3,
    toClientDTO: vi.fn().mockReturnValue({ id: 'kr-1', title: 'Updated KR', weight: 5 }),
  };
  const keyResult2 = {
    id: 'kr-2',
    title: 'Key Result 2',
    weight: 2,
    toClientDTO: vi.fn().mockReturnValue({ id: 'kr-2', title: 'Key Result 2', weight: 2 }),
  };

  return {
    id: 'goal-id-1',
    status: 'IN_PROGRESS',
    name: 'Test Goal',
    description: 'Test description',
    keyResults: [keyResult1, keyResult2],
    updateKeyResult: vi.fn(),
    ...overrides,
  } as any;
}

describe('UpdateGoalKeyResultUseCase', () => {
  it('should update a key result successfully', async () => {
    const goal = createGoalFixture();
    const goalPolicy = { ensureGoalCanBeModified: vi.fn() } as any;
    const goalRepo = createMockRepo<IGoalRepository>({
      findByIdForIdentity: vi.fn().mockResolvedValue(goal),
      save: vi.fn().mockResolvedValue(undefined),
    });
    const useCase = new UpdateGoalKeyResultUseCase(goalRepo, goalPolicy);

    const result = await useCase.execute('goal-id-1', 'identity-1', 'kr-1', {
      title: 'Updated KR',
      weight: 5,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.id).toBe('kr-1');
    }
    expect(goal.updateKeyResult).toHaveBeenCalledWith('kr-1', {
      title: 'Updated KR',
      description: undefined,
      weight: 5,
      startValue: undefined,
      currentValue: undefined,
      targetValue: undefined,
      unit: undefined,
    });
    expect(goalRepo.save).toHaveBeenCalledWith(goal);
  });

  it('should return NOT_FOUND when goal does not exist', async () => {
    const goalPolicy = { ensureGoalCanBeModified: vi.fn() } as any;
    const goalRepo = createMockRepo<IGoalRepository>({
      findByIdForIdentity: vi.fn().mockResolvedValue(null),
      save: vi.fn().mockResolvedValue(undefined),
    });
    const useCase = new UpdateGoalKeyResultUseCase(goalRepo, goalPolicy);

    const result = await useCase.execute('non-existent', 'identity-1', 'kr-1', { title: 'New' });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('NOT_FOUND');
    }
    expect(goalRepo.save).not.toHaveBeenCalled();
  });

  it('should return NOT_FOUND when key result does not exist', async () => {
    const goal = createGoalFixture();
    const goalPolicy = { ensureGoalCanBeModified: vi.fn() } as any;
    const goalRepo = createMockRepo<IGoalRepository>({
      findByIdForIdentity: vi.fn().mockResolvedValue(goal),
      save: vi.fn().mockResolvedValue(undefined),
    });
    const useCase = new UpdateGoalKeyResultUseCase(goalRepo, goalPolicy);

    const result = await useCase.execute('goal-id-1', 'identity-1', 'kr-non-existent', { title: 'New' });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('NOT_FOUND');
      expect(result.error.message).toContain('kr-non-existent');
    }
    expect(goal.updateKeyResult).not.toHaveBeenCalled();
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
      findByIdForIdentity: vi.fn().mockResolvedValue(goal),
      save: vi.fn().mockResolvedValue(undefined),
    });
    const useCase = new UpdateGoalKeyResultUseCase(goalRepo, goalPolicy);

    await expect(useCase.execute('goal-id-1', 'identity-1', 'kr-1', { title: 'New' })).rejects.toThrow(
      'Goal cannot be modified',
    );
    expect(goalRepo.save).not.toHaveBeenCalled();
  });

  it('should pass partial updates correctly', async () => {
    const goal = createGoalFixture();
    const goalPolicy = { ensureGoalCanBeModified: vi.fn() } as any;
    const goalRepo = createMockRepo<IGoalRepository>({
      findByIdForIdentity: vi.fn().mockResolvedValue(goal),
      save: vi.fn().mockResolvedValue(undefined),
    });
    const useCase = new UpdateGoalKeyResultUseCase(goalRepo, goalPolicy);

    await useCase.execute('goal-id-1', 'identity-1', 'kr-1', { description: 'New desc', unit: 'books' });

    expect(goal.updateKeyResult).toHaveBeenCalledWith('kr-1', {
      title: undefined,
      description: 'New desc',
      weight: undefined,
      startValue: undefined,
      currentValue: undefined,
      targetValue: undefined,
      unit: 'books',
    });
  });

  it('should pass currentValue updates correctly', async () => {
    const goal = createGoalFixture();
    const goalPolicy = { ensureGoalCanBeModified: vi.fn() } as any;
    const goalRepo = createMockRepo<IGoalRepository>({
      findByIdForIdentity: vi.fn().mockResolvedValue(goal),
      save: vi.fn().mockResolvedValue(undefined),
    });
    const useCase = new UpdateGoalKeyResultUseCase(goalRepo, goalPolicy);

    await useCase.execute('goal-id-1', 'identity-1', 'kr-1', { currentValue: 11, startValue: 5 });

    expect(goal.updateKeyResult).toHaveBeenCalledWith('kr-1', {
      title: undefined,
      description: undefined,
      weight: undefined,
      startValue: 5,
      currentValue: 11,
      targetValue: undefined,
      unit: undefined,
    });
  });

  it('should call key result toClientDTO', async () => {
    const goal = createGoalFixture();
    const goalPolicy = { ensureGoalCanBeModified: vi.fn() } as any;
    const goalRepo = createMockRepo<IGoalRepository>({
      findByIdForIdentity: vi.fn().mockResolvedValue(goal),
      save: vi.fn().mockResolvedValue(undefined),
    });
    const useCase = new UpdateGoalKeyResultUseCase(goalRepo, goalPolicy);

    await useCase.execute('goal-id-1', 'identity-1', 'kr-1', { title: 'Updated' });

    expect(goal.keyResults[0].toClientDTO).toHaveBeenCalled();
  });
});
