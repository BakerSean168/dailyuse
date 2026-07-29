import type { IGoalRepository } from '../../../domain';
import type { Result } from '@memoflow/contracts/result';
import { ok } from '@memoflow/contracts/result';

export class ArchiveExpiredGoalsUseCase {
  constructor(private readonly goalRepository: IGoalRepository) {}

  async execute(identityId: string): Promise<Result<{ archivedCount: number }>> {
    const goals = await this.goalRepository.findByIdentityId(identityId, {
      systemView: 'active',
      includeChildren: false,
    });

    let archivedCount = 0;
    for (const goal of goals) {
      if (!goal.isOverdue()) continue;
      goal.archiveAsExpired();
      await this.goalRepository.save(goal);
      archivedCount += 1;
    }

    return ok({ archivedCount });
  }
}
