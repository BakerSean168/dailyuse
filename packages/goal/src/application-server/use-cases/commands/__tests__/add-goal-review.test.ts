import { vi, describe, it, expect } from 'vitest';
import { createMockRepo } from '@dailyuse/test-utils/mocks';
import type { IGoalRepository } from '@/domain-server/repositories/i-goal-repository';
import { AddGoalReview } from '../add-goal-review';

// ============================================================
// Helpers
// ============================================================

function createGoalFixture(overrides?: Record<string, any>) {
  return {
    id: 'goal-id-1',
    status: 'IN_PROGRESS',
    name: 'Test Goal',
    description: 'Test description',
    keyResults: [],
    reviews: [],
    createAndAddReview: vi.fn(),
    toClientDTO: vi.fn().mockReturnValue({
      id: 'goal-id-1',
      name: 'Test Goal',
      keyResults: [],
      reviews: [{ title: 'Q1 Review', content: 'Good progress' }],
    }),
    ...overrides,
  } as any;
}

function aReviewInput(overrides?: Record<string, any>) {
  return {
    title: 'Q1 Review',
    content: 'Good progress on all fronts',
    reviewType: 'QUARTERLY',
    ...overrides,
  };
}

describe('AddGoalReview', () => {
  it('should add a review to the goal', async () => {
    const goal = createGoalFixture();
    const goalPolicy = { ensureGoalCanBeModified: vi.fn() } as any;
    const goalRepo = createMockRepo<IGoalRepository>({
      findById: vi.fn().mockResolvedValue(goal),
      save: vi.fn().mockResolvedValue(undefined),
    });
    const useCase = new AddGoalReview(goalRepo, goalPolicy);
    const params = aReviewInput();

    const result = await useCase.execute('goal-id-1', params);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.id).toBe('goal-id-1');
    }
    expect(goal.createAndAddReview).toHaveBeenCalledWith(params);
    expect(goalRepo.save).toHaveBeenCalledWith(goal);
    expect(goalPolicy.ensureGoalCanBeModified).toHaveBeenCalledWith(goal);
  });

  it('should return NOT_FOUND when goal does not exist', async () => {
    const goalPolicy = { ensureGoalCanBeModified: vi.fn() } as any;
    const goalRepo = createMockRepo<IGoalRepository>({
      findById: vi.fn().mockResolvedValue(null),
      save: vi.fn().mockResolvedValue(undefined),
    });
    const useCase = new AddGoalReview(goalRepo, goalPolicy);

    const result = await useCase.execute('non-existent', aReviewInput());

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
    const useCase = new AddGoalReview(goalRepo, goalPolicy);

    await expect(useCase.execute('goal-id-1', aReviewInput())).rejects.toThrow(
      'Goal cannot be modified',
    );
    expect(goalRepo.save).not.toHaveBeenCalled();
    expect(goal.createAndAddReview).not.toHaveBeenCalled();
  });

  it('should pass all optional review params', async () => {
    const goal = createGoalFixture();
    const goalPolicy = { ensureGoalCanBeModified: vi.fn() } as any;
    const goalRepo = createMockRepo<IGoalRepository>({
      findById: vi.fn().mockResolvedValue(goal),
      save: vi.fn().mockResolvedValue(undefined),
    });
    const useCase = new AddGoalReview(goalRepo, goalPolicy);
    const params = aReviewInput({
      rating: 4,
      achievements: 'Completed milestone A',
      challenges: 'Resource constraints',
      nextActions: 'Hire more staff',
    });

    await useCase.execute('goal-id-1', params);

    expect(goal.createAndAddReview).toHaveBeenCalledWith(params);
  });

  it('should call toClientDTO without includeChildren argument', async () => {
    const goal = createGoalFixture();
    const goalPolicy = { ensureGoalCanBeModified: vi.fn() } as any;
    const goalRepo = createMockRepo<IGoalRepository>({
      findById: vi.fn().mockResolvedValue(goal),
      save: vi.fn().mockResolvedValue(undefined),
    });
    const useCase = new AddGoalReview(goalRepo, goalPolicy);

    await useCase.execute('goal-id-1', aReviewInput());

    expect(goal.toClientDTO).toHaveBeenCalledWith();
  });

  it('should call findById with includeChildren option', async () => {
    const goal = createGoalFixture();
    const goalPolicy = { ensureGoalCanBeModified: vi.fn() } as any;
    const goalRepo = createMockRepo<IGoalRepository>({
      findById: vi.fn().mockResolvedValue(goal),
      save: vi.fn().mockResolvedValue(undefined),
    });
    const useCase = new AddGoalReview(goalRepo, goalPolicy);

    await useCase.execute('goal-id-1', aReviewInput());

    expect(goalRepo.findById).toHaveBeenCalledWith('goal-id-1', { includeChildren: true });
  });
});
