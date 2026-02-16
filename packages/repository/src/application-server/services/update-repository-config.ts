/**
 * Update Repository Config
 *
 * UpdateRepository閰嶇疆
 */

import type { IRepositoryRepository } from '../../domain-server/repositories/IRepositoryRepository';
import type {
  RepositoryClientDTO,
  RepositoryConfigServerDTO,
} from '@dailyuse/contracts/repository';

/**
 * Update Repository Config Input
 */
export interface UpdateRepositoryConfigInput {
  id: string;
  config: Partial<RepositoryConfigServerDTO>;
}

/**
 * Update Repository Config Output
 */
export interface UpdateRepositoryConfigOutput {
  repository: RepositoryClientDTO;
}

/**
 * Update Repository Config
 */
export class UpdateRepositoryConfig {

  constructor(private readonly repositoryRepository: IRepositoryRepository) {}

  async execute(input: UpdateRepositoryConfigInput): Promise<UpdateRepositoryConfigOutput> {
    const repository = await this.repositoryRepository.findById(input.id);
    if (!repository) {
      throw new Error(`Repository not found: ${input.id}`);
    }

    repository.updateConfig(input.config);
    await this.repositoryRepository.save(repository);

    return { repository: repository.toClientDTO() };
  }
}

