import { vi, describe, it, expect } from 'vitest';
import { createMockRepo } from '@dailyuse/test-utils/mocks';
import type { IGoalRepository } from '@/domain-server';
import type { ProgressBreakdown } from '@dailyuse/contracts/goal';
import { GetGoalProgressBreakdownUseCase } from '../get-goal-progress-breakdown.use-case';

// ============================================================
// Helpers
// ============================================================

function createGoalFixture(breakdown?: Partial<ProgressBreakdown>) {
  const defaultBreakdown: ProgressBreakdown = {
    totalProgress: 0.5,
    calculationMode: 'WeightedAverage',
    krContributions: [
      { keyResultId: 'kr-1' as any, keyResultName: 'KR1', progress: 50, weight: 3, contribution: 0.3 },
      { keyResultId: 'kr-2' as any, keyResultName: 'KR2', progress: 100, weight: 2, contribution: 0.2 },
    ],
    lastUpdateTime: Date.now(),
    updateTrigger: '自动计算',
  };

  return {
    id: 'goal-id-1',
    name: 'Test Goal',
    getProgressBreakdown: vi.fn().mockReturnValue({ ...defaultBreakdown, ...breakdown }),
  } as any;
}

// ============================================================
// Tests
// ============================================================

describe('GetGoalProgressBreakdownUseCase', () => {
  it('delegates to domain aggregate getProgressBreakdown()', async () => {
    const breakdown: ProgressBreakdown = {
      totalProgress: 0.75,
      calculationMode: 'WeightedAverage',
      krContributions: [],
      lastUpdateTime: 1000,
      updateTrigger: '自动计算',
    };
    const goal = createGoalFixture(breakdown);
    const goalRepo = createMockRepo<IGoalRepository>({
      findById: vi.fn().mockResolvedValue(goal),
    });

    const useCase = new GetGoalProgressBreakdownUseCase(goalRepo);
    const result = await useCase.execute('goal-id-1');

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.totalProgress).toBe(0.75);
    expect(goal.getProgressBreakdown).toHaveBeenCalled();
  });

  it('returns NOT_FOUND when goal does not exist', async () => {
    const goalRepo = createMockRepo<IGoalRepository>({
      findById: vi.fn().mockResolvedValue(null),
    });

    const useCase = new GetGoalProgressBreakdownUseCase(goalRepo);
    const result = await useCase.execute('non-existent');

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('NOT_FOUND');
  });

  it('passes includeChildren=true to repository', async () => {
    const goal = createGoalFixture();
    const findById = vi.fn().mockResolvedValue(goal);
    const goalRepo = createMockRepo<IGoalRepository>({ findById });

    const useCase = new GetGoalProgressBreakdownUseCase(goalRepo);
    await useCase.execute('goal-id-1');

    expect(findById).toHaveBeenCalledWith('goal-id-1', { includeChildren: true });
  });

  it('returns krContributions from domain aggregate', async () => {
    const goal = createGoalFixture({
      krContributions: [
        { keyResultId: 'kr-a' as any, keyResultName: 'KR A', progress: 80, weight: 5, contribution: 0.4 },
      ],
    });
    const goalRepo = createMockRepo<IGoalRepository>({
      findById: vi.fn().mockResolvedValue(goal),
    });

    const useCase = new GetGoalProgressBreakdownUseCase(goalRepo);
    const result = await useCase.execute('goal-id-1');

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.krContributions).toHaveLength(1);
    expect(result.data.krContributions[0].keyResultName).toBe('KR A');
  });

  it('preserves calculationMode and updateTrigger from domain', async () => {
    const goal = createGoalFixture({
      calculationMode: 'WeightedAverage',
      updateTrigger: '自动计算',
    });
    const goalRepo = createMockRepo<IGoalRepository>({
      findById: vi.fn().mockResolvedValue(goal),
    });

    const useCase = new GetGoalProgressBreakdownUseCase(goalRepo);
    const result = await useCase.execute('goal-id-1');

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.calculationMode).toBe('WeightedAverage');
    expect(result.data.updateTrigger).toBe('自动计算');
  });
});
