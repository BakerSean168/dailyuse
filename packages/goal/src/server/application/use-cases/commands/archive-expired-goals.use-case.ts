import { GoalVersionConflictError, type IGoalRepository } from '../../../domain';
import type { Result } from '@memoflow/contracts/result';
import { ok } from '@memoflow/contracts/result';
import type { GoalWriteTransactionRunner } from './goal-write-support';

export class ArchiveExpiredGoalsUseCase {
  constructor(
    private readonly transactionRunner: GoalWriteTransactionRunner,
    private readonly candidateRepository: IGoalRepository,
  ) {}

  async execute(identityId: string): Promise<Result<{ archivedCount: number }>> {
    const candidates = await this.candidateRepository.findByIdentityId(identityId, {
      systemView: 'active',
      includeChildren: false,
    });

    let archivedCount = 0;
    for (const candidate of candidates) {
      if (!candidate.isOverdue()) continue;
      try {
        const archived = await this.transactionRunner.run(async ({ goalRepository }) => {
          const goal = await goalRepository.findByIdForIdentity(identityId, String(candidate.id), {
            includeChildren: true,
          });
          if (!goal || !goal.isOverdue()) return false;

          const expectedVersion = goal.version;
          goal.archiveAsExpired();
          goal.advanceVersion();
          await goalRepository.saveRootWithExpectedVersion(goal, expectedVersion);
          return true;
        });
        if (archived) archivedCount += 1;
      } catch (cause) {
        // A concurrent writer owns this cycle. Keep the goal active and let the
        // next scheduled sweep re-evaluate its latest authoritative state.
        if (cause instanceof GoalVersionConflictError) continue;
        throw cause;
      }
    }

    return ok({ archivedCount });
  }
}
