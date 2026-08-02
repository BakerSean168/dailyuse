import { describe, expect, it, vi } from 'vitest';
import '@memoflow/test-utils/helpers/result-matchers';
import { createMockRepo } from '@memoflow/test-utils/mocks';
import type { IGoalRecordRepository, IGoalRepository } from '../../../../domain';
import { Goal, GoalVersionConflictError } from '../../../../domain';
import type { GoalWriteTransactionRunner } from '../goal-write-support';
import { ArchiveExpiredGoalsUseCase } from '../archive-expired-goals.use-case';

function createExpiredGoal() {
  const goal = Goal.create({
    identityId: 'identity-1' as any,
    name: 'Expired goal',
    description: null,
    color: '#3B82F6',
    feasibilityAnalysis: null,
    motivation: null,
    importance: 'Moderate' as any,
    category: null,
    tags: [],
    startDate: Date.now() - 20_000,
    targetDate: Date.now() - 10_000,
    folderId: null,
    parentGoalId: null,
    reminderConfig: null,
  });
  goal.createAndAddKeyResult({
    title: 'Preserved KR',
    valueType: 'Absolute',
    targetValue: 10,
    weight: 3,
  });
  goal.createAndAddReview({
    title: 'Preserved review',
    content: 'Do not delete children during root state changes',
    reviewType: 'Weekly',
  });
  return goal;
}

function createRunner(goalRepository: IGoalRepository): GoalWriteTransactionRunner {
  const goalRecordRepository = createMockRepo<IGoalRecordRepository>();
  return { run: (work) => work({ goalRepository, goalRecordRepository }) };
}

describe('ArchiveExpiredGoalsUseCase', () => {
  it('reloads each candidate with children and archives it through aggregate CAS', async () => {
    const reloaded = createExpiredGoal();
    const repository = createMockRepo<IGoalRepository>({
      findByIdentityId: vi.fn().mockResolvedValue([reloaded]),
      findByIdForIdentity: vi.fn().mockResolvedValue(reloaded),
      saveRootWithExpectedVersion: vi.fn().mockResolvedValue(undefined),
    });
    const runner = createRunner(repository);
    const run = vi.spyOn(runner, 'run');
    const useCase = new ArchiveExpiredGoalsUseCase(runner, repository);

    const result = await useCase.execute('identity-1');

    expect(result).toBeOk();
    if (result.ok) expect(result.data).toEqual({ archivedCount: 1 });
    expect(run).toHaveBeenCalledTimes(1);
    expect(repository.findByIdForIdentity).toHaveBeenCalledWith('identity-1', String(reloaded.id), {
      includeChildren: true,
    });
    expect(reloaded.keyResults).toHaveLength(1);
    expect(reloaded.goalReviews).toHaveLength(1);
    expect(repository.saveRootWithExpectedVersion).toHaveBeenCalledWith(reloaded, 1);
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('does not count a goal whose aggregate CAS loses a concurrent race', async () => {
    const goal = createExpiredGoal();
    const repository = createMockRepo<IGoalRepository>({
      findByIdentityId: vi.fn().mockResolvedValue([goal]),
      findByIdForIdentity: vi.fn().mockResolvedValue(goal),
      saveRootWithExpectedVersion: vi.fn().mockRejectedValue(new GoalVersionConflictError()),
    });
    const useCase = new ArchiveExpiredGoalsUseCase(createRunner(repository), repository);

    const result = await useCase.execute('identity-1');

    expect(result).toBeOk();
    if (result.ok) expect(result.data).toEqual({ archivedCount: 0 });
  });
});
