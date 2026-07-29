import { vi, describe, it, expect } from 'vitest';
import { createMockRepo } from '@memoflow/test-utils/mocks';
import type { IGoalRepository } from '../../../../domain/repositories/i-goal-repository';
import { DeleteGoalKeyResultUseCase } from '../delete-goal-key-result.use-case';

// ============================================================
// Helpers
// ============================================================

function createGoalFixture(overrides?: Record<string, any>) {
  const keyResult1 = { id: 'kr-1', title: 'Key Result 1' };
  const keyResult2 = { id: 'kr-2', title: 'Key Result 2' };

  return {
    id: 'goal-id-1',
    status: 'IN_PROGRESS',
    name: 'Test Goal',
    description: 'Test description',
    keyResults: [keyResult1, keyResult2],
    removeKeyResult: vi.fn().mockReturnValue(keyResult1),
    ...overrides,
  } as any;
}

describe('DeleteGoalKeyResultUseCase', () => {
  it('should delete a key result from the goal', async () => {
    const goal = createGoalFixture();
    const goalPolicy = { ensureGoalCanBeModified: vi.fn() } as any;
    const goalRepo = createMockRepo<IGoalRepository>({
      findByIdForIdentity: vi.fn().mockResolvedValue(goal),
      save: vi.fn().mockResolvedValue(undefined),
    });
    const useCase = new DeleteGoalKeyResultUseCase(goalRepo, goalPolicy);

    const result = await useCase.execute('goal-id-1', 'identity-1', 'kr-1');

    expect(result.ok).toBe(true);
    expect(goal.removeKeyResult).toHaveBeenCalledWith('kr-1');
    expect(goalRepo.save).toHaveBeenCalledWith(goal);
    expect(goalPolicy.ensureGoalCanBeModified).toHaveBeenCalledWith(goal);
  });

  it('should return NOT_FOUND when goal does not exist', async () => {
    const goalPolicy = { ensureGoalCanBeModified: vi.fn() } as any;
    const goalRepo = createMockRepo<IGoalRepository>({
      findByIdForIdentity: vi.fn().mockResolvedValue(null),
      save: vi.fn().mockResolvedValue(undefined),
    });
    const useCase = new DeleteGoalKeyResultUseCase(goalRepo, goalPolicy);

    const result = await useCase.execute('non-existent', 'identity-1', 'kr-1');

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
      findByIdForIdentity: vi.fn().mockResolvedValue(goal),
      save: vi.fn().mockResolvedValue(undefined),
    });
    const useCase = new DeleteGoalKeyResultUseCase(goalRepo, goalPolicy);

    await expect(useCase.execute('goal-id-1', 'identity-1', 'kr-1')).rejects.toThrow('Goal cannot be modified');
    expect(goalRepo.save).not.toHaveBeenCalled();
  });

  it('should call findByIdForIdentity with includeChildren option', async () => {
    const goal = createGoalFixture();
    const goalPolicy = { ensureGoalCanBeModified: vi.fn() } as any;
    const goalRepo = createMockRepo<IGoalRepository>({
      findByIdForIdentity: vi.fn().mockResolvedValue(goal),
      save: vi.fn().mockResolvedValue(undefined),
    });
    const useCase = new DeleteGoalKeyResultUseCase(goalRepo, goalPolicy);

    await useCase.execute('goal-id-1', 'identity-1', 'kr-1');

    expect(goalRepo.findByIdForIdentity).toHaveBeenCalledWith('identity-1', 'goal-id-1', { includeChildren: true });
  });
});
