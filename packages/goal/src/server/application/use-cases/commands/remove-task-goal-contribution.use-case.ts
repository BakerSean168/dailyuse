import type { GoalRecordSourceTypeValue } from '@memoflow/contracts/goal';
import type { Result } from '@memoflow/contracts/result';
import { error, ok } from '@memoflow/contracts/result';
import type { IGoalRecordRepository, IGoalRepository } from '../../../domain';
import { GoalVersionConflictError, KeyResultProgress } from '../../../domain';
import {
  createInlineGoalWriteTransactionRunner,
  type GoalWriteTransactionRunner,
} from './goal-write-support';

export class RemoveTaskGoalContributionUseCase {
  constructor(
    goalRepository: IGoalRepository,
    goalRecordRepository: IGoalRecordRepository,
    private readonly transactionRunner: GoalWriteTransactionRunner =
      createInlineGoalWriteTransactionRunner({ goalRepository, goalRecordRepository }),
  ) {}

  async execute(
    identityId: string,
    sourceType: GoalRecordSourceTypeValue,
    sourceId: string,
  ): Promise<Result<{ removed: boolean }>> {
    return this.transactionRunner.run(async ({ goalRepository, goalRecordRepository }) => {
      const record = await goalRecordRepository.findBySource(identityId, sourceType, sourceId);
      if (!record) {
        return ok({ removed: false });
      }

      const goal = await goalRepository.findByKeyResultIdForIdentity(
        identityId,
        String(record.keyResultId),
      );
      const keyResult = goal?.getKeyResult(String(record.keyResultId));
      if (!goal || !keyResult) {
        return error('NOT_FOUND', 'Goal contribution owner no longer exists');
      }

      const expectedVersion = goal.version;
      const progress = KeyResultProgress.fromDTO(keyResult.progress);
      let nextValue: number;
      if (progress.aggregationMethod === 'Sum') {
        nextValue = progress.currentValue - record.value;
      } else {
        const records = await goalRecordRepository.findByKeyResultId(
          identityId,
          String(record.keyResultId),
          { orderBy: 'asc' },
        );
        const remaining = records.filter((item) => String(item.id) !== String(record.id));
        nextValue = progress.recalculateFromHistory(remaining.map((item) => item.value)).currentValue;
      }

      if (nextValue !== progress.currentValue) {
        goal.updateKeyResultProgress(String(record.keyResultId), nextValue);
        goal.advanceVersion();
        try {
          await goalRepository.saveRootWithExpectedVersion(goal, expectedVersion);
        } catch (cause) {
          if (cause instanceof GoalVersionConflictError) {
            return error('CONFLICT', cause.message);
          }
          throw cause;
        }
      }

      await goalRecordRepository.delete(identityId, String(record.id));

      return ok({ removed: true });
    });
  }
}
