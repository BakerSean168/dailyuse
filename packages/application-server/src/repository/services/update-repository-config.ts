/**
 * Update Repository Config
 *
 * 鏇存柊浠撳偍閰嶇疆
 */

import type { IRepositoryRepository } from '@dailyuse/domain-server/repository';
import type {
  RepositoryClientDTO,
  RepositoryConfigServerDTO,
} from '@dailyuse/contracts/repository';

/**
 * Update Repository Config Input
 */
export interface UpdateRepositoryConfigInput {
  uuid: string;
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
    const repository = await this.repositoryRepository.findByUuid(input.uuid);
    if (!repository) {
      throw new Error(`Repository not found: ${input.uuid}`);
    }

    repository.updateConfig(input.config);
    await this.repositoryRepository.save(repository);

    return { repository: repository.toClientDTO() };
  }
}

