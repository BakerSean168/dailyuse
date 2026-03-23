import type { IGoalRepository } from '@/domain-server';
import type { Result } from '@dailyuse/contracts/result';
import { ok } from '@dailyuse/contracts/result';

export class ArchiveExpiredGoals {
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
