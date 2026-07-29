import { vi, describe, it, expect } from 'vitest';
import { createMockRepo } from '@memoflow/test-utils/mocks';
import type { IGoalRepository } from '../../../../domain';
import { BatchUpdateKeyResultWeightsUseCase } from '../batch-update-key-result-weights.use-case';
import type { UpdateGoalKeyResultUseCase } from '../update-goal-key-result.use-case';

// ============================================================
// Helpers
// ============================================================

function createGoalFixture() {
  return {
    id: 'goal-id-1',
    name: 'Test Goal',
    toClientDTO: vi.fn().mockReturnValue({
      id: 'goal-id-1',
      name: 'Test Goal',
      keyResults: [
        { id: 'kr-1', weight: 5 },
        { id: 'kr-2', weight: 3 },
      ],
    }),
  } as any;
}

function createMockUpdateKeyResultUseCase(
  results: Array<{ ok: boolean; data?: any; error?: any }> = [{ ok: true, data: {} }],
): UpdateGoalKeyResultUseCase {
  let callIndex = 0;
  return {
    execute: vi.fn().mockImplementation(() => {
      const result = results[Math.min(callIndex, results.length - 1)];
      callIndex++;
      return Promise.resolve(result);
    }),
  } as any;
}

// ============================================================
// Tests
// ============================================================

describe('BatchUpdateKeyResultWeightsUseCase', () => {
  it('updates all key result weights sequentially', async () => {
    const goal = createGoalFixture();
    const goalRepo = createMockRepo<IGoalRepository>({
      findByIdForIdentity: vi.fn().mockResolvedValue(goal),
    });
    const updateKeyResult = createMockUpdateKeyResultUseCase();

    const useCase = new BatchUpdateKeyResultWeightsUseCase(goalRepo, updateKeyResult);
    const result = await useCase.execute('goal-id-1', 'identity-1', [
      { keyResultId: 'kr-1', weight: 5 },
      { keyResultId: 'kr-2', weight: 3 },
    ]);

    expect(result.ok).toBe(true);
    expect(updateKeyResult.execute).toHaveBeenCalledTimes(2);
    expect(updateKeyResult.execute).toHaveBeenCalledWith('goal-id-1', 'identity-1', 'kr-1', { weight: 5 });
    expect(updateKeyResult.execute).toHaveBeenCalledWith('goal-id-1', 'identity-1', 'kr-2', { weight: 3 });
  });

  it('short-circuits on first failure', async () => {
    const goal = createGoalFixture();
    const goalRepo = createMockRepo<IGoalRepository>({
      findByIdForIdentity: vi.fn().mockResolvedValue(goal),
    });
    const updateKeyResult = createMockUpdateKeyResultUseCase([
      { ok: false, error: { code: 'NOT_FOUND', message: 'KR not found' } },
    ]);

    const useCase = new BatchUpdateKeyResultWeightsUseCase(goalRepo, updateKeyResult);
    const result = await useCase.execute('goal-id-1', 'identity-1', [
      { keyResultId: 'kr-bad', weight: 5 },
      { keyResultId: 'kr-2', weight: 3 },
    ]);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('NOT_FOUND');
    expect(updateKeyResult.execute).toHaveBeenCalledTimes(1);
  });

  it('returns updated goal after all weights are updated', async () => {
    const goal = createGoalFixture();
    const findByIdForIdentity = vi.fn().mockResolvedValue(goal);
    const goalRepo = createMockRepo<IGoalRepository>({ findByIdForIdentity });
    const updateKeyResult = createMockUpdateKeyResultUseCase();

    const useCase = new BatchUpdateKeyResultWeightsUseCase(goalRepo, updateKeyResult);
    const result = await useCase.execute('goal-id-1', 'identity-1', [{ keyResultId: 'kr-1', weight: 7 }]);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.id).toBe('goal-id-1');
    expect(findByIdForIdentity).toHaveBeenCalledWith('identity-1', 'goal-id-1', { includeChildren: true });
  });

  it('returns NOT_FOUND when goal does not exist after updates', async () => {
    const goalRepo = createMockRepo<IGoalRepository>({
      findByIdForIdentity: vi.fn().mockResolvedValue(null),
    });
    const updateKeyResult = createMockUpdateKeyResultUseCase();

    const useCase = new BatchUpdateKeyResultWeightsUseCase(goalRepo, updateKeyResult);
    const result = await useCase.execute('non-existent', 'identity-1', [{ keyResultId: 'kr-1', weight: 5 }]);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('NOT_FOUND');
  });

  it('handles empty update array', async () => {
    const goal = createGoalFixture();
    const goalRepo = createMockRepo<IGoalRepository>({
      findByIdForIdentity: vi.fn().mockResolvedValue(goal),
    });
    const updateKeyResult = createMockUpdateKeyResultUseCase();

    const useCase = new BatchUpdateKeyResultWeightsUseCase(goalRepo, updateKeyResult);
    const result = await useCase.execute('goal-id-1', 'identity-1', []);

    expect(result.ok).toBe(true);
    expect(updateKeyResult.execute).not.toHaveBeenCalled();
  });
});
