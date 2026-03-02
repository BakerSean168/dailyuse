import { vi, describe, it, expect } from 'vitest';
import { createMockRepo } from '@dailyuse/test-utils';
import type { IGoalRepository } from '@/domain-server';
import { GetGoal } from '../get-goal';

// ============================================================
// Helpers
// ============================================================

function createGoalFixture(overrides?: Record<string, any>) {
  return {
    id: overrides?.id ?? 'goal-id-1',
    name: overrides?.name ?? 'Test Goal',
    description: overrides?.description ?? 'Test description',
    status: overrides?.status ?? 'IN_PROGRESS',
    title: overrides?.title ?? 'Test Goal',
    targetDate: overrides?.targetDate ?? null,
    keyResults: overrides?.keyResults ?? [],
    getOverallProgress: vi.fn().mockReturnValue(overrides?.progress ?? 50),
    toClientDTO: vi.fn().mockReturnValue({
      id: overrides?.id ?? 'goal-id-1',
      name: overrides?.name ?? 'Test Goal',
      description: overrides?.description ?? 'Test description',
      status: overrides?.status ?? 'IN_PROGRESS',
    }),
    ...overrides,
  } as any;
}

// ============================================================
// Tests
// ============================================================

describe('GetGoal', () => {
  it('should return a goal by ID', async () => {
    const goal = createGoalFixture();
    const goalRepo = createMockRepo<IGoalRepository>({
      findById: vi.fn().mockResolvedValue(goal),
    });
    const useCase = new GetGoal(goalRepo);

    const result = await useCase.execute('goal-id-1');

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data).toEqual({
      id: 'goal-id-1',
      name: 'Test Goal',
      description: 'Test description',
      status: 'IN_PROGRESS',
    });
    expect(goal.toClientDTO).toHaveBeenCalledWith(true);
  });

  it('should return NOT_FOUND when goal does not exist', async () => {
    const goalRepo = createMockRepo<IGoalRepository>({
      findById: vi.fn().mockResolvedValue(null),
    });
    const useCase = new GetGoal(goalRepo);

    const result = await useCase.execute('non-existent');

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('NOT_FOUND');
    expect(result.error.message).toContain('non-existent');
  });

  it('should pass includeChildren option to repository', async () => {
    const goal = createGoalFixture();
    const findById = vi.fn().mockResolvedValue(goal);
    const goalRepo = createMockRepo<IGoalRepository>({
      findById,
    });
    const useCase = new GetGoal(goalRepo);

    await useCase.execute('goal-id-1', true);

    expect(findById).toHaveBeenCalledWith('goal-id-1', { includeChildren: true });
  });

  it('should pass includeChildren as undefined when not provided', async () => {
    const goal = createGoalFixture();
    const findById = vi.fn().mockResolvedValue(goal);
    const goalRepo = createMockRepo<IGoalRepository>({
      findById,
    });
    const useCase = new GetGoal(goalRepo);

    await useCase.execute('goal-id-1');

    expect(findById).toHaveBeenCalledWith('goal-id-1', { includeChildren: undefined });
  });

  it('should return the DTO produced by toClientDTO', async () => {
    const customDTO = {
      id: 'custom-id',
      name: 'Custom Goal',
      description: 'Custom desc',
      status: 'COMPLETED',
    };
    const goal = createGoalFixture({
      toClientDTO: vi.fn().mockReturnValue(customDTO),
    });
    const goalRepo = createMockRepo<IGoalRepository>({
      findById: vi.fn().mockResolvedValue(goal),
    });
    const useCase = new GetGoal(goalRepo);

    const result = await useCase.execute('custom-id');

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data).toEqual(customDTO);
  });
});
