import { describe, it, expect, vi } from 'vitest';
import { createMockRepo } from '@memoflow/test-utils/mocks';
import { Goal, GoalRecord } from '../../../../domain';
import type { IGoalRecordRepository, IGoalRepository } from '../../../../domain';
import { DeleteGoalRecordUseCase } from '../delete-goal-record.use-case';
import { createInlineGoalWriteTransactionRunner } from '../goal-write-support';
import { InMemoryGoalReliableOperationAdapter } from '../../../../infrastructure/adapters/in-memory/in-memory-goal-reliable-operation.adapter';

describe('DeleteGoalRecordUseCase', () => {
  it('atomically removes a record and recalculates Sum from full history', async () => {
    const goal = Goal.create({
      identityId: 'identity-1' as any,
      name: 'Atomic record deletion',
      description: null,
      feasibilityAnalysis: null,
      motivation: null,
      startDate: null,
      reminderConfig: null,
    });
    const keyResult = goal.createAndAddKeyResult({
      title: 'Points',
      aggregationMethod: 'Sum',
      startingValue: 0,
      currentValue: 5,
      targetValue: 20,
      weight: 1,
      unit: 'points',
    });
    const deletedRecord = GoalRecord.create({
      keyResultId: keyResult.id as any,
      identityId: 'identity-1' as any,
      value: 2,
    });
    const remainingRecord = GoalRecord.create({
      keyResultId: keyResult.id as any,
      identityId: 'identity-1' as any,
      value: 3,
    });
    const goalRepository = createMockRepo<IGoalRepository>({
      findByIdForIdentity: vi.fn().mockResolvedValue(goal),
      saveRootWithExpectedVersion: vi.fn().mockResolvedValue(undefined),
    });
    const recordRepository = createMockRepo<IGoalRecordRepository>({
      findByIdForIdentity: vi.fn().mockResolvedValue(deletedRecord),
      findByKeyResultId: vi.fn().mockResolvedValue([deletedRecord, remainingRecord]),
      delete: vi.fn().mockResolvedValue(undefined),
    });
    const useCase = new DeleteGoalRecordUseCase(
      goalRepository,
      recordRepository,
      createInlineGoalWriteTransactionRunner(
        { goalRepository, goalRecordRepository: recordRepository },
        new InMemoryGoalReliableOperationAdapter(),
      ),
    );

    const result = await useCase.execute(
      goal.id,
      keyResult.id,
      deletedRecord.id,
      'identity-1',
      goal.version,
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.goalVersion).toBe(2);
      expect(result.data.readModel.keyResults?.[0]?.progress.currentValue).toBe(3);
      expect(result.data.recordChanges).toEqual({
        upserted: [],
        removedIds: [deletedRecord.id],
      });
    }
    expect(goal.getKeyResult(keyResult.id)?.progress.currentValue).toBe(3);
    expect(recordRepository.delete).toHaveBeenCalledWith('identity-1', deletedRecord.id);
    expect(goalRepository.saveRootWithExpectedVersion).toHaveBeenCalledWith(goal, 1);
  });

  it('returns NOT_FOUND when record is missing or foreign', async () => {
    const goalRepository = createMockRepo<IGoalRepository>({
      findByIdForIdentity: vi.fn().mockResolvedValue({ version: 1 }),
    });
    const recordRepository = createMockRepo<IGoalRecordRepository>({
      findByIdForIdentity: vi.fn().mockResolvedValue(null),
      delete: vi.fn(),
    });
    const useCase = new DeleteGoalRecordUseCase(
      goalRepository,
      recordRepository,
      createInlineGoalWriteTransactionRunner(
        { goalRepository, goalRecordRepository: recordRepository },
        new InMemoryGoalReliableOperationAdapter(),
      ),
    );

    const result = await useCase.execute('goal-1', 'kr-1', 'record-1', 'identity-other', 1);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('NOT_FOUND');
    expect(recordRepository.delete).not.toHaveBeenCalled();
  });
});
