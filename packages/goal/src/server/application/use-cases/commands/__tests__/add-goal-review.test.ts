import { vi, describe, it, expect } from 'vitest';
import { createMockRepo } from '@memoflow/test-utils/mocks';
import type { IGoalRepository } from '../../../../domain/repositories/i-goal-repository';
import { AddGoalReviewUseCase } from '../add-goal-review.use-case';

// ============================================================
// Helpers
// ============================================================

function createGoalFixture(overrides?: Record<string, any>) {
  const reviewDto = {
    id: 'review-id-1',
    goalId: 'goal-id-1',
    type: 'Quarterly',
    rating: 4,
    summary: 'Good progress on all fronts',
    achievements: null,
    challenges: null,
    improvements: null,
    keyResultSnapshots: [],
    version: 1,
    reviewedAt: Date.now(),
    createdAt: Date.now(),
    updatedAt: Date.now(),
    deletedAt: null,
  };
  const createdReview = {
    toClientDTO: vi.fn().mockReturnValue(reviewDto),
  };

  return {
    id: 'goal-id-1',
    status: 'IN_PROGRESS',
    name: 'Test Goal',
    description: 'Test description',
    keyResults: [],
    reviews: [],
    createAndAddReview: vi.fn().mockReturnValue(createdReview),
    _createdReview: createdReview,
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

describe('AddGoalReviewUseCase', () => {
  it('should add a review to the goal', async () => {
    const goal = createGoalFixture();
    const goalPolicy = { ensureGoalCanBeModified: vi.fn() } as any;
    const goalRepo = createMockRepo<IGoalRepository>({
      findByIdForIdentity: vi.fn().mockResolvedValue(goal),
      save: vi.fn().mockResolvedValue(undefined),
    });
    const useCase = new AddGoalReviewUseCase(goalRepo, goalPolicy);
    const params = aReviewInput();

    const result = await useCase.execute('goal-id-1', 'identity-1', params);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.id).toBe('review-id-1');
    }
    expect(goal.createAndAddReview).toHaveBeenCalledWith(params);
    expect(goalRepo.save).toHaveBeenCalledWith(goal);
    expect(goalPolicy.ensureGoalCanBeModified).toHaveBeenCalledWith(goal);
  });

  it('should return NOT_FOUND when goal does not exist', async () => {
    const goalPolicy = { ensureGoalCanBeModified: vi.fn() } as any;
    const goalRepo = createMockRepo<IGoalRepository>({
      findByIdForIdentity: vi.fn().mockResolvedValue(null),
      save: vi.fn().mockResolvedValue(undefined),
    });
    const useCase = new AddGoalReviewUseCase(goalRepo, goalPolicy);

    const result = await useCase.execute('non-existent', 'identity-1', aReviewInput());

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
    const useCase = new AddGoalReviewUseCase(goalRepo, goalPolicy);

    await expect(useCase.execute('goal-id-1', 'identity-1', aReviewInput())).rejects.toThrow(
      'Goal cannot be modified',
    );
    expect(goalRepo.save).not.toHaveBeenCalled();
    expect(goal.createAndAddReview).not.toHaveBeenCalled();
  });

  it('should pass all optional review params', async () => {
    const goal = createGoalFixture();
    const goalPolicy = { ensureGoalCanBeModified: vi.fn() } as any;
    const goalRepo = createMockRepo<IGoalRepository>({
      findByIdForIdentity: vi.fn().mockResolvedValue(goal),
      save: vi.fn().mockResolvedValue(undefined),
    });
    const useCase = new AddGoalReviewUseCase(goalRepo, goalPolicy);
    const params = aReviewInput({
      rating: 4,
      achievements: 'Completed milestone A',
      challenges: 'Resource constraints',
      nextActions: 'Hire more staff',
    });

    await useCase.execute('goal-id-1', 'identity-1', params);

    expect(goal.createAndAddReview).toHaveBeenCalledWith(params);
  });

  it('should return the created review DTO', async () => {
    const goal = createGoalFixture();
    const goalPolicy = { ensureGoalCanBeModified: vi.fn() } as any;
    const goalRepo = createMockRepo<IGoalRepository>({
      findByIdForIdentity: vi.fn().mockResolvedValue(goal),
      save: vi.fn().mockResolvedValue(undefined),
    });
    const useCase = new AddGoalReviewUseCase(goalRepo, goalPolicy);

    await useCase.execute('goal-id-1', 'identity-1', aReviewInput());

    expect(goal._createdReview.toClientDTO).toHaveBeenCalledWith();
  });

  it('should call findByIdForIdentity with includeChildren option', async () => {
    const goal = createGoalFixture();
    const goalPolicy = { ensureGoalCanBeModified: vi.fn() } as any;
    const goalRepo = createMockRepo<IGoalRepository>({
      findByIdForIdentity: vi.fn().mockResolvedValue(goal),
      save: vi.fn().mockResolvedValue(undefined),
    });
    const useCase = new AddGoalReviewUseCase(goalRepo, goalPolicy);

    await useCase.execute('goal-id-1', 'identity-1', aReviewInput());

    expect(goalRepo.findByIdForIdentity).toHaveBeenCalledWith('identity-1', 'goal-id-1', { includeChildren: true });
  });
});
