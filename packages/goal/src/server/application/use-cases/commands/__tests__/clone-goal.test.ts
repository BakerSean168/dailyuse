import { vi, describe, it, expect } from 'vitest';
import { createMockRepo } from '@memoflow/test-utils/mocks';
import type { IGoalRepository } from '../../../../domain';
import { CloneGoalUseCase } from '../clone-goal.use-case';
import type { CreateGoalUseCase } from '../create-goal.use-case';

// ============================================================
// Helpers
// ============================================================

function createOriginalGoalFixture(overrides?: Record<string, any>) {
  return {
    id: 'original-id',
    name: overrides?.name ?? 'Original Goal',
    description: overrides?.description ?? 'Original desc',
    feasibilityAnalysis: overrides?.feasibilityAnalysis ?? 'Feasible',
    motivation: overrides?.motivation ?? 'Original motivation',
  } as any;
}

function createMockCreateGoalUseCase(): CreateGoalUseCase {
  return {
    execute: vi.fn().mockResolvedValue({ ok: true, data: { id: 'new-id', name: 'New Goal' } }),
  } as any;
}

function aContext() {
  return { identityId: 'user-1' } as any;
}

// ============================================================
// Tests
// ============================================================

describe('CloneGoalUseCase', () => {
  it('creates a new goal with default name "${original} (Copy)"', async () => {
    const goal = createOriginalGoalFixture();
    const goalRepo = createMockRepo<IGoalRepository>({
      findByIdForIdentity: vi.fn().mockResolvedValue(goal),
    });
    const createGoal = createMockCreateGoalUseCase();

    const useCase = new CloneGoalUseCase(goalRepo, createGoal);
    const result = await useCase.execute('original-id', {}, aContext());

    expect(result.ok).toBe(true);
    expect(createGoal.execute).toHaveBeenCalledTimes(1);

    const createPayload = vi.mocked(createGoal.execute).mock.calls[0][0];
    expect(createPayload.name).toBe('Original Goal (Copy)');
  });

  it('uses custom name when provided', async () => {
    const goal = createOriginalGoalFixture();
    const goalRepo = createMockRepo<IGoalRepository>({
      findByIdForIdentity: vi.fn().mockResolvedValue(goal),
    });
    const createGoal = createMockCreateGoalUseCase();

    const useCase = new CloneGoalUseCase(goalRepo, createGoal);
    await useCase.execute('original-id', { name: 'Custom Clone' }, aContext());

    const createPayload = vi.mocked(createGoal.execute).mock.calls[0][0];
    expect(createPayload.name).toBe('Custom Clone');
  });

  it('inherits canonical Direction context without retired taxonomy', async () => {
    const goal = createOriginalGoalFixture({
      feasibilityAnalysis: 'Feasible path',
      motivation: 'Graduate on time',
    });
    const goalRepo = createMockRepo<IGoalRepository>({
      findByIdForIdentity: vi.fn().mockResolvedValue(goal),
    });
    const createGoal = createMockCreateGoalUseCase();
    const useCase = new CloneGoalUseCase(goalRepo, createGoal);

    await useCase.execute('original-id', {}, aContext());

    const createPayload = vi.mocked(createGoal.execute).mock.calls[0][0];
    expect(createPayload.feasibilityAnalysis).toBe('Feasible path');
    expect(createPayload.motivation).toBe('Graduate on time');
    expect('importance' in createPayload).toBe(false);
    expect('category' in createPayload).toBe(false);
    expect('tags' in createPayload).toBe(false);
  });

  it('returns NOT_FOUND when original goal does not exist', async () => {
    const goalRepo = createMockRepo<IGoalRepository>({
      findByIdForIdentity: vi.fn().mockResolvedValue(null),
    });
    const createGoal = createMockCreateGoalUseCase();

    const useCase = new CloneGoalUseCase(goalRepo, createGoal);
    const result = await useCase.execute('non-existent', {}, aContext());

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('NOT_FOUND');
    expect(createGoal.execute).not.toHaveBeenCalled();
  });

  it('passes execution context to CreateGoalUseCase', async () => {
    const goal = createOriginalGoalFixture();
    const goalRepo = createMockRepo<IGoalRepository>({
      findByIdForIdentity: vi.fn().mockResolvedValue(goal),
    });
    const createGoal = createMockCreateGoalUseCase();
    const cx = aContext();

    const useCase = new CloneGoalUseCase(goalRepo, createGoal);
    await useCase.execute('original-id', {}, cx);

    expect(createGoal.execute).toHaveBeenCalledWith(expect.anything(), cx);
  });

  it('uses original description when clone params omit it', async () => {
    const goal = createOriginalGoalFixture({ description: 'Original desc' });
    const goalRepo = createMockRepo<IGoalRepository>({
      findByIdForIdentity: vi.fn().mockResolvedValue(goal),
    });
    const createGoal = createMockCreateGoalUseCase();

    const useCase = new CloneGoalUseCase(goalRepo, createGoal);
    await useCase.execute('original-id', {}, aContext());

    const createPayload = vi.mocked(createGoal.execute).mock.calls[0][0];
    expect(createPayload.description).toBe('Original desc');
  });
});
