import { describe, expect, it, vi } from 'vitest';
import '@memoflow/test-utils/helpers/result-matchers';
import { createMockRepo } from '@memoflow/test-utils/mocks';
import type { IGoalRepository } from '../../../../domain/repositories/i-goal-repository';
import { AddGoalReviewUseCase } from '../add-goal-review.use-case';

const NOW = Date.UTC(2026, 7, 26, 0, 0, 0);
const context = {
  windowStartAt: NOW - 7 * 24 * 60 * 60 * 1000,
  windowEndAt: NOW,
  overallProgress: { startPercentage: 40, endPercentage: 50, deltaPercentage: 10 },
  keyResults: [],
  summary: { recordCount: 4, manualRecordCount: 3, taskContributionCount: 1 },
};

function createGoalFixture(overrides?: Record<string, any>) {
  const reviewDto = {
    id: 'review-id-1', goalId: 'goal-id-1', reflection: 'Good progress',
    challenges: null, adjustments: null, systemContext: context,
    reviewedAt: NOW, createdAt: NOW, updatedAt: NOW,
  };
  const createdReview = { id: 'review-id-1', toClientDTO: vi.fn().mockReturnValue(reviewDto) };
  return {
    id: 'goal-id-1', version: 1, keyResults: [], goalReviews: [],
    advanceVersion: vi.fn(function (this: { version: number }) { this.version += 1; }),
    createAndAddReview: vi.fn().mockReturnValue(createdReview),
    toClientDTO: vi.fn().mockReturnValue({ id: 'goal-id-1', version: 2, reviews: [reviewDto] }),
    ...overrides,
  } as any;
}

function aReviewInput(overrides?: Record<string, any>) {
  return { expectedVersion: 1, reflection: 'Good progress', ...overrides };
}

function createUseCase(goal: any, contextBuilder = { build: vi.fn().mockResolvedValue(context) }) {
  const goalPolicy = { ensureGoalCanBeModified: vi.fn() } as any;
  const goalRepo = createMockRepo<IGoalRepository>({
    findByIdForIdentity: vi.fn().mockResolvedValue(goal),
    saveRootWithExpectedVersion: vi.fn().mockResolvedValue(undefined),
  });
  return {
    useCase: new AddGoalReviewUseCase(goalRepo, goalPolicy, contextBuilder as any, () => NOW),
    goalRepo,
    goalPolicy,
    contextBuilder,
  };
}

describe('AddGoalReviewUseCase', () => {
  it('freezes server-generated facts and persists only user reflection', async () => {
    const goal = createGoalFixture();
    const { useCase, goalRepo, contextBuilder } = createUseCase(goal);
    const result = await useCase.execute('goal-id-1', 'identity-1', aReviewInput({
      challenges: 'Resource constraints', adjustments: 'Change the next sprint', windowDays: 7,
    }));

    expect(result).toBeOk();
    expect(contextBuilder.build).toHaveBeenCalledWith(goal, {
      windowStartAt: NOW - 7 * 24 * 60 * 60 * 1000,
      windowEndAt: NOW,
    });
    expect(goal.createAndAddReview).toHaveBeenCalledWith({
      reflection: 'Good progress',
      challenges: 'Resource constraints',
      adjustments: 'Change the next sprint',
      systemContext: context,
    });
    expect(goalRepo.saveRootWithExpectedVersion).toHaveBeenCalledWith(goal, 1);
  });

  it('returns the committed Goal read model and review id', async () => {
    const goal = createGoalFixture();
    const { useCase } = createUseCase(goal);
    const result = await useCase.execute('goal-id-1', 'identity-1', aReviewInput());
    expect(result).toBeOk();
    if (result.ok) {
      expect(result.data.affectedEntityIds.reviewIds).toEqual(['review-id-1']);
      expect(result.data.readModel.reviews?.[0]?.id).toBe('review-id-1');
    }
    expect(goal.toClientDTO).toHaveBeenCalledWith(true);
  });

  it('returns NOT_FOUND before calculating facts', async () => {
    const { useCase, contextBuilder } = createUseCase(null);
    const result = await useCase.execute('missing', 'identity-1', aReviewInput());
    expect(result).toBeErrorWithCode('NOT_FOUND');
    expect(contextBuilder.build).not.toHaveBeenCalled();
  });

  it('rejects policy failures before calculating facts', async () => {
    const goal = createGoalFixture();
    const contextBuilder = { build: vi.fn().mockResolvedValue(context) };
    const goalRepo = createMockRepo<IGoalRepository>({
      findByIdForIdentity: vi.fn().mockResolvedValue(goal),
      saveRootWithExpectedVersion: vi.fn(),
    });
    const useCase = new AddGoalReviewUseCase(goalRepo, {
      ensureGoalCanBeModified: vi.fn(() => { throw new Error('Goal cannot be modified'); }),
    } as any, contextBuilder as any, () => NOW);
    await expect(useCase.execute('goal-id-1', 'identity-1', aReviewInput())).rejects.toThrow(
      'Goal cannot be modified',
    );
    expect(contextBuilder.build).not.toHaveBeenCalled();
  });

  it('rejects a stale goal version before calculating facts', async () => {
    const goal = createGoalFixture();
    const { useCase, goalRepo, contextBuilder } = createUseCase(goal);
    const result = await useCase.execute('goal-id-1', 'identity-1', aReviewInput({ expectedVersion: 2 }));
    expect(result).toBeErrorWithCode('CONFLICT');
    expect(contextBuilder.build).not.toHaveBeenCalled();
    expect(goalRepo.saveRootWithExpectedVersion).not.toHaveBeenCalled();
  });
});
