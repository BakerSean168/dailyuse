import { vi, describe, it, expect } from 'vitest';
import { createMockRepo } from '@memoflow/test-utils/mocks';
import type { IGoalRepository } from '../../../../domain/repositories/i-goal-repository';
import { PermanentlyDeleteGoalUseCase } from '../permanently-delete-goal.use-case';

// ============================================================
// Helpers
// ============================================================

function createGoalFixture(overrides?: Record<string, any>) {
  return {
    id: 'goal-id-1',
    status: 'ARCHIVED',
    name: 'Archived Goal',
    description: 'Test description',
    archivedAt: new Date(),
    keyResults: [],
    ...overrides,
  } as any;
}

describe('PermanentlyDeleteGoalUseCase', () => {
  it('should permanently delete an archived goal', async () => {
    const goal = createGoalFixture();
    const goalPolicy = { ensureGoalCanBePermanentlyDeleted: vi.fn() } as any;
    const goalRepo = createMockRepo<IGoalRepository>({
      findByIdForIdentity: vi.fn().mockResolvedValue(goal),
      delete: vi.fn().mockResolvedValue(undefined),
    });
    const useCase = new PermanentlyDeleteGoalUseCase(goalRepo, goalPolicy);

    const result = await useCase.execute('goal-id-1', 'identity-1');

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.id).toBe('goal-id-1');
    }
    expect(goalPolicy.ensureGoalCanBePermanentlyDeleted).toHaveBeenCalledWith(goal);
    expect(goalRepo.delete).toHaveBeenCalledWith('identity-1', 'goal-id-1');
  });

  it('should return NOT_FOUND when goal does not exist', async () => {
    const goalPolicy = { ensureGoalCanBePermanentlyDeleted: vi.fn() } as any;
    const goalRepo = createMockRepo<IGoalRepository>({
      findByIdForIdentity: vi.fn().mockResolvedValue(null),
      delete: vi.fn().mockResolvedValue(undefined),
    });
    const useCase = new PermanentlyDeleteGoalUseCase(goalRepo, goalPolicy);

    const result = await useCase.execute('non-existent', 'identity-1');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('NOT_FOUND');
    }
    expect(goalRepo.delete).not.toHaveBeenCalled();
    expect(goalPolicy.ensureGoalCanBePermanentlyDeleted).not.toHaveBeenCalled();
  });

  it('should throw when policy rejects deletion (goal not archived)', async () => {
    const goal = createGoalFixture({ status: 'IN_PROGRESS', archivedAt: null });
    const goalPolicy = {
      ensureGoalCanBePermanentlyDeleted: vi.fn().mockImplementation(() => {
        throw new Error('Goal must be archived before permanent deletion');
      }),
    } as any;
    const goalRepo = createMockRepo<IGoalRepository>({
      findByIdForIdentity: vi.fn().mockResolvedValue(goal),
      delete: vi.fn().mockResolvedValue(undefined),
    });
    const useCase = new PermanentlyDeleteGoalUseCase(goalRepo, goalPolicy);

    await expect(useCase.execute('goal-id-1', 'identity-1')).rejects.toThrow(
      'Goal must be archived before permanent deletion',
    );
    expect(goalRepo.delete).not.toHaveBeenCalled();
  });

  it('should call findByIdForIdentity with includeChildren option', async () => {
    const goal = createGoalFixture();
    const goalPolicy = { ensureGoalCanBePermanentlyDeleted: vi.fn() } as any;
    const goalRepo = createMockRepo<IGoalRepository>({
      findByIdForIdentity: vi.fn().mockResolvedValue(goal),
      delete: vi.fn().mockResolvedValue(undefined),
    });
    const useCase = new PermanentlyDeleteGoalUseCase(goalRepo, goalPolicy);

    await useCase.execute('goal-id-1', 'identity-1');

    expect(goalRepo.findByIdForIdentity).toHaveBeenCalledWith('identity-1', 'goal-id-1', {
      includeChildren: true,
    });
  });

  it('should not call delete when policy throws', async () => {
    const goal = createGoalFixture();
    const goalPolicy = {
      ensureGoalCanBePermanentlyDeleted: vi.fn().mockImplementation(() => {
        throw new Error('Cannot delete');
      }),
    } as any;
    const goalRepo = createMockRepo<IGoalRepository>({
      findByIdForIdentity: vi.fn().mockResolvedValue(goal),
      delete: vi.fn().mockResolvedValue(undefined),
    });
    const useCase = new PermanentlyDeleteGoalUseCase(goalRepo, goalPolicy);

    await expect(useCase.execute('goal-id-1', 'identity-1')).rejects.toThrow('Cannot delete');
    expect(goalRepo.delete).not.toHaveBeenCalled();
  });
});
