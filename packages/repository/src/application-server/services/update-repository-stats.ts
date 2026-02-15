/**
 * Update Repository Stats
 *
 * UpdateRepository缁熻
 */

import type { IRepositoryRepository } from '../../domain-server/repositories/IRepositoryRepository';
import type {
  RepositoryClientDTO,
  RepositoryStatsServerDTO,
} from '@dailyuse/contracts/repository';

/**
 * Update Repository Stats Input
 */
export interface UpdateRepositoryStatsInput {
  uuid: string;
  stats: Partial<RepositoryStatsServerDTO>;
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
    const repository = await this.repositoryRepository.findById(input.uuid);
    if (!repository) {
      throw new Error(`Repository not found: ${input.uuid}`);
    }

    repository.updateStats(input.stats);
    await this.repositoryRepository.save(repository);

    return { repository: repository.toClientDTO() };
  }
}

