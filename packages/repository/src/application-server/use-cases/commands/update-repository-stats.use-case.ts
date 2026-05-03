/**
 * Update Repository Stats
 *
 * Update repository stats
 */

import type { IRepositoryRepository } from '../../../domain-server/repositories/IRepositoryRepository';
import type {
  RepositoryClientDTO,
  RepositoryStatsDTO,
} from '@dailyuse/contracts/repository';
import type { Result } from '@dailyuse/contracts/result';
import { ok, error } from '@dailyuse/contracts/result';

/**
 * Update Repository Stats Input
 */
export interface UpdateRepositoryStatsInput {
  id: string;
  stats: Partial<RepositoryStatsDTO>;
}

/**
 * Update Repository Stats Output
 */
export interface UpdateRepositoryStatsOutput {
  repository: RepositoryClientDTO;
}

/**
 * Update Repository Stats Use Case
 */
export class UpdateRepositoryStatsUseCase {

  constructor(private readonly repositoryRepository: IRepositoryRepository) {}

  async execute(input: UpdateRepositoryStatsInput): Promise<Result<UpdateRepositoryStatsOutput>> {
    const repository = await this.repositoryRepository.findById(input.id);
    if (!repository) {
      return error('NOT_FOUND', `Repository not found: ${input.id}`);
    }

    repository.updateStats(input.stats);
    await this.repositoryRepository.save(repository);

    return ok({ repository: repository.toClientDTO() });
  }
}
