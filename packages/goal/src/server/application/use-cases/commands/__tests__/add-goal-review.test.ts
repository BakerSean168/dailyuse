import { vi, describe, it, expect } from 'vitest';
import '@memoflow/test-utils/helpers/result-matchers';
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
    id: 'review-id-1',
    toClientDTO: vi.fn().mockReturnValue(reviewDto),
  };

  return {
    id: 'goal-id-1',
    status: 'IN_PROGRESS',
    name: 'Test Goal',
    description: 'Test description',
    keyResults: [],
    reviews: [],
    version: 1,
    advanceVersion: vi.fn(function (this: { version: number }) {
      this.version += 1;
    }),
    createAndAddReview: vi.fn().mockReturnValue(createdReview),
    toClientDTO: vi.fn().mockReturnValue({
      id: 'goal-id-1',
      version: 2,
      reviews: [reviewDto],
    }),
    _createdReview: createdReview,
    ...overrides,
  } as any;
}

function aReviewInput(overrides?: Record<string, any>) {
  return {
    title: 'Q1 Review',
    expectedVersion: 1,
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
      saveRootWithExpectedVersion: vi.fn().mockResolvedValue(undefined),
    });
    const useCase = new AddGoalReviewUseCase(goalRepo, goalPolicy);
    const params = aReviewInput();

    const result = await useCase.execute('goal-id-1', 'identity-1', params);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.affectedEntityIds.reviewIds).toEqual(['review-id-1']);
      expect(result.data.readModel.reviews?.[0]?.id).toBe('review-id-1');
    }
    expect(goal.createAndAddReview).toHaveBeenCalledWith(
      expect.not.objectContaining({ expectedVersion: expect.anything() }),
    );
    expect(goalRepo.saveRootWithExpectedVersion).toHaveBeenCalledWith(goal, 1);
    expect(goalPolicy.ensureGoalCanBeModified).toHaveBeenCalledWith(goal);
  });

  it('should return NOT_FOUND when goal does not exist', async () => {
    const goalPolicy = { ensureGoalCanBeModified: vi.fn() } as any;
    const goalRepo = createMockRepo<IGoalRepository>({
      findByIdForIdentity: vi.fn().mockResolvedValue(null),
      saveRootWithExpectedVersion: vi.fn().mockResolvedValue(undefined),
    });
    const useCase = new AddGoalReviewUseCase(goalRepo, goalPolicy);

    const result = await useCase.execute('non-existent', 'identity-1', aReviewInput());

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('NOT_FOUND');
    }
    expect(goalRepo.saveRootWithExpectedVersion).not.toHaveBeenCalled();
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
      saveRootWithExpectedVersion: vi.fn().mockResolvedValue(undefined),
    });
    const useCase = new AddGoalReviewUseCase(goalRepo, goalPolicy);

    await expect(useCase.execute('goal-id-1', 'identity-1', aReviewInput())).rejects.toThrow(
      'Goal cannot be modified',
    );
    expect(goalRepo.saveRootWithExpectedVersion).not.toHaveBeenCalled();
    expect(goal.createAndAddReview).not.toHaveBeenCalled();
  });

  it('should pass all optional review params', async () => {
    const goal = createGoalFixture();
    const goalPolicy = { ensureGoalCanBeModified: vi.fn() } as any;
    const goalRepo = createMockRepo<IGoalRepository>({
      findByIdForIdentity: vi.fn().mockResolvedValue(goal),
      saveRootWithExpectedVersion: vi.fn().mockResolvedValue(undefined),
    });
    const useCase = new AddGoalReviewUseCase(goalRepo, goalPolicy);
    const params = aReviewInput({
      rating: 4,
      achievements: 'Completed milestone A',
      challenges: 'Resource constraints',
      nextActions: 'Hire more staff',
    });

    await useCase.execute('goal-id-1', 'identity-1', params);

    expect(goal.createAndAddReview).toHaveBeenCalledWith(
      expect.objectContaining({ rating: 4, achievements: 'Completed milestone A' }),
    );
  });

  it('materializes the authoritative Goal read model', async () => {
    const goal = createGoalFixture();
    const goalPolicy = { ensureGoalCanBeModified: vi.fn() } as any;
    const goalRepo = createMockRepo<IGoalRepository>({
      findByIdForIdentity: vi.fn().mockResolvedValue(goal),
      saveRootWithExpectedVersion: vi.fn().mockResolvedValue(undefined),
    });
    const useCase = new AddGoalReviewUseCase(goalRepo, goalPolicy);

    await useCase.execute('goal-id-1', 'identity-1', aReviewInput());

    expect(goal.toClientDTO).toHaveBeenCalledWith(true);
  });

  it('should call findByIdForIdentity with includeChildren option', async () => {
    const goal = createGoalFixture();
    const goalPolicy = { ensureGoalCanBeModified: vi.fn() } as any;
    const goalRepo = createMockRepo<IGoalRepository>({
      findByIdForIdentity: vi.fn().mockResolvedValue(goal),
      saveRootWithExpectedVersion: vi.fn().mockResolvedValue(undefined),
    });
    const useCase = new AddGoalReviewUseCase(goalRepo, goalPolicy);

    await useCase.execute('goal-id-1', 'identity-1', aReviewInput());

    expect(goalRepo.findByIdForIdentity).toHaveBeenCalledWith('identity-1', 'goal-id-1', { includeChildren: true });
  });

  it('rejects a stale goal version before creating a review', async () => {
    const goal = createGoalFixture();
    const goalRepo = createMockRepo<IGoalRepository>({
      findByIdForIdentity: vi.fn().mockResolvedValue(goal),
      saveRootWithExpectedVersion: vi.fn().mockResolvedValue(undefined),
    });
    const useCase = new AddGoalReviewUseCase(goalRepo, {
      ensureGoalCanBeModified: vi.fn(),
    } as any);

    const result = await useCase.execute(
      'goal-id-1',
      'identity-1',
      aReviewInput({ expectedVersion: 2 }),
    );

    expect(result).toBeErrorWithCode('CONFLICT');
    expect(goal.createAndAddReview).not.toHaveBeenCalled();
    expect(goalRepo.saveRootWithExpectedVersion).not.toHaveBeenCalled();
  });
});
