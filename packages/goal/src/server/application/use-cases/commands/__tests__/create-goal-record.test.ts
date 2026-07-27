import { beforeEach, describe, expect, it, vi } from 'vitest';
import '@dailyuse/test-utils/helpers/result-matchers';
import { createMockRepo } from '@dailyuse/test-utils/mocks';
import { Goal, GoalRecord } from '../../../../domain';
import type { IGoalRepository } from '../../../../domain/repositories/i-goal-repository';
import type { IGoalRecordRepository } from '../../../../domain/repositories/i-goal-record-repository';
import { CreateGoalRecordUseCase } from '../create-goal-record.use-case';

function createTestGoal() {
  return Goal.create({
    identityId: 'identity-1' as any,
    name: 'Graduation Goal',
    description: null,
    color: '#3B82F6',
    feasibilityAnalysis: null,
    motivation: null,
    importance: 'Moderate' as any,
    category: null,
    tags: [],
    startDate: null,
    targetDate: null,
    folderId: null,
    parentGoalId: null,
    reminderConfig: null,
  });
}

describe('CreateGoalRecordUseCase', () => {
  let goalRepository: ReturnType<typeof createMockRepo<IGoalRepository>>;
  let goalRecordRepository: ReturnType<typeof createMockRepo<IGoalRecordRepository>>;
  let useCase: CreateGoalRecordUseCase;

  beforeEach(() => {
    vi.clearAllMocks();
    goalRepository = createMockRepo<IGoalRepository>({
      findByIdForIdentity: vi.fn(),
      save: vi.fn().mockResolvedValue(undefined),
    });
    goalRecordRepository = createMockRepo<IGoalRecordRepository>({
      findByKeyResultId: vi.fn().mockResolvedValue([]),
      save: vi.fn().mockResolvedValue(undefined),
      findByGoalId: vi.fn().mockResolvedValue([]),
      findByKeyResultIds: vi.fn().mockResolvedValue(new Map()),
      countByKeyResultId: vi.fn().mockResolvedValue(0),
      delete: vi.fn().mockResolvedValue(undefined),
      deleteMany: vi.fn().mockResolvedValue(undefined),
    });
    useCase = new CreateGoalRecordUseCase(goalRepository, goalRecordRepository);
  });

  it('preserves manual current progress as the base when creating a Sum record', async () => {
    const goal = createTestGoal();
    const keyResult = goal.createAndAddKeyResult({
      title: 'Second-class points',
      valueType: 'Incremental',
      aggregationMethod: 'Sum',
      startValue: 0,
      currentValue: 41,
      targetValue: 50,
      weight: 1,
      unit: 'points',
    });

    vi.mocked(goalRepository.findByIdForIdentity).mockResolvedValue(goal);
    vi.mocked(goalRecordRepository.findByKeyResultId).mockResolvedValue([]);

    const result = await useCase.execute(
      goal.id,
      keyResult.id,
      { value: 1, note: 'Volunteer activity' },
      'identity-1',
    );

    expect(result).toBeOk();
    expect(goal.getKeyResult(keyResult.id)?.progress.currentValue).toBe(42);
    expect(goalRepository.save).toHaveBeenCalledWith(goal);
    expect(goalRecordRepository.save).toHaveBeenCalledTimes(1);

    if (result.ok) {
      expect(result.data.value).toBe(1);
      expect(result.data.valueAfter).toBe(42);
    }
  });

  it('keeps standard history recalculation for non-Sum records', async () => {
    const goal = createTestGoal();
    const keyResult = goal.createAndAddKeyResult({
      title: 'Latest score',
      valueType: 'Absolute',
      aggregationMethod: 'Last',
      startValue: 0,
      currentValue: 41,
      targetValue: 50,
      weight: 1,
      unit: 'points',
    });

    const existingRecord = GoalRecord.create({
      keyResultId: keyResult.id as any,
      identityId: 'identity-1' as any,
      value: 41,
    });

    vi.mocked(goalRepository.findByIdForIdentity).mockResolvedValue(goal);
    vi.mocked(goalRecordRepository.findByKeyResultId).mockResolvedValue([existingRecord]);

    const result = await useCase.execute(goal.id, keyResult.id, { value: 44 }, 'identity-1');

    expect(result).toBeOk();
    expect(goal.getKeyResult(keyResult.id)?.progress.currentValue).toBe(44);
    if (result.ok) {
      expect(result.data.valueAfter).toBe(44);
    }
  });
});
