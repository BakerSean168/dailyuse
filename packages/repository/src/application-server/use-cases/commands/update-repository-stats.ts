/**
 * Update Repository Stats
 *
 * UpdateRepository缁熻
 */

import type { IRepositoryRepository } from '../../../domain-server/repositories/IRepositoryRepository';
import type {
  RepositoryClientDTO,
  RepositoryStatsDTO,
} from '@dailyuse/contracts/repository';

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
 * Update Repository Stats
 */
export class UpdateRepositoryStats {

  constructor(private readonly repositoryRepository: IRepositoryRepository) {}

  async execute(input: UpdateRepositoryStatsInput): Promise<UpdateRepositoryStatsOutput> {
    const repository = await this.repositoryRepository.findById(input.id);
    if (!repository) {
      throw new Error(`Repository not found: ${input.id}`);
    }

    repository.updateStats(input.stats);
    await this.repositoryRepository.save(repository);

    return { repository: repository.toClientDTO() };
  }
}

