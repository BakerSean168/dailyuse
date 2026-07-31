import { beforeEach, describe, expect, it, vi } from 'vitest';
import '@memoflow/test-utils/helpers/result-matchers';
import { createMockRepo } from '@memoflow/test-utils/mocks';
import { Goal, GoalRecord } from '../../../../domain';
import type { IGoalRepository } from '../../../../domain/repositories/i-goal-repository';
import type { IGoalRecordRepository } from '../../../../domain/repositories/i-goal-record-repository';
import { RemoveTaskGoalContributionUseCase } from '../remove-task-goal-contribution.use-case';

function createGoalWithProgress() {
  const goal = Goal.create({
    identityId: 'identity-1' as never,
    name: 'Delivery goal',
    description: null,
    color: '#0f766e',
    feasibilityAnalysis: null,
    motivation: null,
    importance: 'Important' as never,
    category: null,
    tags: [],
    startDate: null,
    targetDate: null,
    folderId: null,
    parentGoalId: null,
    reminderConfig: null,
  });
  const keyResult = goal.createAndAddKeyResult({
    title: 'Completed tasks',
    valueType: 'Incremental',
    aggregationMethod: 'Sum',
    startValue: 0,
    currentValue: 3,
    targetValue: 10,
    weight: 1,
    unit: 'tasks',
  });
  return { goal, keyResult };
}

describe('RemoveTaskGoalContributionUseCase', () => {
  let goalRepository: ReturnType<typeof createMockRepo<IGoalRepository>>;
  let goalRecordRepository: ReturnType<typeof createMockRepo<IGoalRecordRepository>>;
  let useCase: RemoveTaskGoalContributionUseCase;

  beforeEach(() => {
    goalRepository = createMockRepo<IGoalRepository>({
      findByKeyResultIdForIdentity: vi.fn(),
      save: vi.fn().mockResolvedValue(undefined),
    });
    goalRecordRepository = createMockRepo<IGoalRecordRepository>({
      findBySource: vi.fn().mockResolvedValue(null),
      findByKeyResultId: vi.fn().mockResolvedValue([]),
      delete: vi.fn().mockResolvedValue(undefined),
    });
    useCase = new RemoveTaskGoalContributionUseCase(goalRepository, goalRecordRepository);
  });

  it('deletes the exact source record and reverses its Sum contribution', async () => {
    const { goal, keyResult } = createGoalWithProgress();
    const record = GoalRecord.create({
      keyResultId: keyResult.id as never,
      identityId: 'identity-1' as never,
      value: 3,
      source: { type: 'TASK_INSTANCE', id: 'task-instance-1' },
    });
    vi.mocked(goalRecordRepository.findBySource).mockResolvedValue(record);
    vi.mocked(goalRepository.findByKeyResultIdForIdentity).mockResolvedValue(goal);

    const result = await useCase.execute(
      'identity-1',
      'TASK_INSTANCE',
      'task-instance-1',
    );

    expect(result).toBeOk();
    expect(goalRecordRepository.delete).toHaveBeenCalledWith('identity-1', String(record.id));
    expect(goal.getKeyResult(keyResult.id)?.progress.currentValue).toBe(0);
    expect(goalRepository.save).toHaveBeenCalledWith(goal);
  });

  it('is idempotent when the source contribution is already absent', async () => {
    const result = await useCase.execute(
      'identity-1',
      'TASK_INSTANCE',
      'task-instance-1',
    );

    expect(result).toBeOk();
    expect(goalRecordRepository.delete).not.toHaveBeenCalled();
    expect(goalRepository.save).not.toHaveBeenCalled();
  });
});
