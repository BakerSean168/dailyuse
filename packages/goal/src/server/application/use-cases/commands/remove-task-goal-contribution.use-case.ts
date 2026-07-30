import type { GoalRecordSourceTypeValue } from '@memoflow/contracts/goal';
import type { Result } from '@memoflow/contracts/result';
import { error, ok } from '@memoflow/contracts/result';
import type { IGoalRecordRepository, IGoalRepository } from '../../../domain';
import { KeyResultProgress } from '../../../domain';

export class RemoveTaskGoalContributionUseCase {
  constructor(
    private readonly goalRepository: IGoalRepository,
    private readonly goalRecordRepository: IGoalRecordRepository,
  ) {}

  async execute(
    identityId: string,
    sourceType: GoalRecordSourceTypeValue,
    sourceId: string,
  ): Promise<Result<{ removed: boolean }>> {
    const record = await this.goalRecordRepository.findBySource(
      identityId,
      sourceType,
      sourceId,
    );
    if (!record) {
      return ok({ removed: false });
    }

    const goal = await this.goalRepository.findByKeyResultIdForIdentity(
      identityId,
      String(record.keyResultId),
    );
    const keyResult = goal?.getKeyResult(String(record.keyResultId));
    if (!goal || !keyResult) {
      return error('NOT_FOUND', 'Goal contribution owner no longer exists');
    }

    await this.goalRecordRepository.delete(identityId, String(record.id));

    const progress = KeyResultProgress.fromDTO(keyResult.progress);
    let nextValue: number;
    if (progress.aggregationMethod === 'Sum') {
      nextValue = progress.currentValue - record.value;
    } else {
      const remaining = await this.goalRecordRepository.findByKeyResultId(
        identityId,
        String(record.keyResultId),
        { orderBy: 'asc' },
      );
      nextValue = progress.recalculateFromHistory(remaining.map((item) => item.value)).currentValue;
    }

    if (nextValue !== progress.currentValue) {
      goal.updateKeyResultProgress(String(record.keyResultId), nextValue);
      await this.goalRepository.save(goal);
    }

    return ok({ removed: true });
  }
}
