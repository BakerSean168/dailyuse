import { vi, describe, it, expect } from 'vitest';
import { createMockRepo } from '@dailyuse/test-utils/mocks';
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
    importance: overrides?.importance ?? 'Important',
    category: overrides?.category ?? 'work',
    tags: overrides?.tags ?? ['tag1'],
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

  it('inherits importance, category, and tags from original', async () => {
    const goal = createOriginalGoalFixture({
      importance: 'Vital',
      category: 'work',
      tags: ['fitness', 'health'],
    });
    const goalRepo = createMockRepo<IGoalRepository>({
      findByIdForIdentity: vi.fn().mockResolvedValue(goal),
    });
    const createGoal = createMockCreateGoalUseCase();

    const useCase = new CloneGoalUseCase(goalRepo, createGoal);
    await useCase.execute('original-id', {}, aContext());

    const createPayload = vi.mocked(createGoal.execute).mock.calls[0][0];
    expect(createPayload.importance).toBe('Vital');
    expect(createPayload.category).toBe('work');
    expect(createPayload.tags).toEqual(['fitness', 'health']);
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
