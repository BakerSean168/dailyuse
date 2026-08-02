import { describe, expect, it, vi } from 'vitest';
import '@memoflow/test-utils/helpers/result-matchers';
import { createMockRepo } from '@memoflow/test-utils/mocks';
import type { IGoalRepository } from '../../../../domain';
import { UpdateGoalReviewUseCase } from '../update-goal-review.use-case';
import { DeleteGoalReviewUseCase } from '../delete-goal-review.use-case';

describe('UpdateGoalReviewUseCase', () => {
  it('returns the committed Goal read model and affected review', async () => {
    const review = { id: 'review-1' };
    const goal = {
      id: 'goal-1',
      version: 1,
      goalReviews: [review],
      updateReview: vi.fn(),
      advanceVersion: vi.fn(function (this: { version: number }) {
        this.version += 1;
      }),
      toClientDTO: vi.fn().mockReturnValue({ id: 'goal-1', version: 2, reviews: [review] }),
    } as any;
    const repository = createMockRepo<IGoalRepository>({
      findByIdForIdentity: vi.fn().mockResolvedValue(goal),
      saveRootWithExpectedVersion: vi.fn().mockResolvedValue(undefined),
    });
    const useCase = new UpdateGoalReviewUseCase(repository, {
      ensureGoalCanBeModified: vi.fn(),
    } as any);

    const result = await useCase.execute('goal-1', 'identity-1', 'review-1', {
      expectedVersion: 1,
      content: 'Changed',
    });

    expect(result).toBeOk();
    if (result.ok) {
      expect(result.data.goalVersion).toBe(2);
      expect(result.data.affectedEntityIds.reviewIds).toEqual(['review-1']);
    }
  });

  it('rejects a stale goal version before changing a review', async () => {
    const goal = {
      id: 'goal-1',
      version: 1,
      goalReviews: [],
      updateReview: vi.fn(),
      advanceVersion: vi.fn(),
    } as any;
    const repository = createMockRepo<IGoalRepository>({
      findByIdForIdentity: vi.fn().mockResolvedValue(goal),
      saveRootWithExpectedVersion: vi.fn().mockResolvedValue(undefined),
    });
    const useCase = new UpdateGoalReviewUseCase(repository, {
      ensureGoalCanBeModified: vi.fn(),
    } as any);

    const result = await useCase.execute('goal-1', 'identity-1', 'review-1', {
      expectedVersion: 2,
      content: 'Changed',
    });

    expect(result).toBeErrorWithCode('CONFLICT');
    expect(goal.updateReview).not.toHaveBeenCalled();
    expect(repository.saveRootWithExpectedVersion).not.toHaveBeenCalled();
  });
});

describe('DeleteGoalReviewUseCase', () => {
  it('returns the committed Goal read model without the removed review', async () => {
    const removed = { id: 'review-1' };
    const goal = {
      id: 'goal-1',
      version: 1,
      removeReview: vi.fn().mockReturnValue(removed),
      advanceVersion: vi.fn(function (this: { version: number }) {
        this.version += 1;
      }),
      toClientDTO: vi.fn().mockReturnValue({ id: 'goal-1', version: 2, reviews: [] }),
    } as any;
    const repository = createMockRepo<IGoalRepository>({
      findByIdForIdentity: vi.fn().mockResolvedValue(goal),
      saveRootWithExpectedVersion: vi.fn().mockResolvedValue(undefined),
    });
    const useCase = new DeleteGoalReviewUseCase(repository, {
      ensureGoalCanBeModified: vi.fn(),
    } as any);

    const result = await useCase.execute('goal-1', 'identity-1', 'review-1', 1);

    expect(result).toBeOk();
    if (result.ok) {
      expect(result.data.affectedEntityIds.reviewIds).toEqual(['review-1']);
      expect(result.data.readModel.reviews).toEqual([]);
    }
  });

  it('rejects a stale goal version before removing a review', async () => {
    const goal = {
      id: 'goal-1',
      version: 1,
      removeReview: vi.fn(),
      advanceVersion: vi.fn(),
    } as any;
    const repository = createMockRepo<IGoalRepository>({
      findByIdForIdentity: vi.fn().mockResolvedValue(goal),
      saveRootWithExpectedVersion: vi.fn().mockResolvedValue(undefined),
    });
    const useCase = new DeleteGoalReviewUseCase(repository, {
      ensureGoalCanBeModified: vi.fn(),
    } as any);

    const result = await useCase.execute('goal-1', 'identity-1', 'review-1', 2);

    expect(result).toBeErrorWithCode('CONFLICT');
    expect(goal.removeReview).not.toHaveBeenCalled();
    expect(repository.saveRootWithExpectedVersion).not.toHaveBeenCalled();
  });
});
