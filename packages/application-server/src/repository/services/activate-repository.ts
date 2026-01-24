/**
 * Activate Repository
 *
 * 婵€娲讳粨鍌?
 */

import type { IRepositoryRepository } from '@dailyuse/domain-server/repository';
import type { RepositoryClientDTO } from '@dailyuse/contracts/repository';

/**
 * Activate Repository Input
 */
export interface ActivateRepositoryInput {
  uuid: string;
}

/**
 * Activate Repository Output
 */
export interface ActivateRepositoryOutput {
  repository: RepositoryClientDTO;
}

/**
 * Activate Repository
 */
export class ActivateRepository {

  constructor(private readonly repositoryRepository: IRepositoryRepository) {}

  async execute(input: ActivateRepositoryInput): Promise<ActivateRepositoryOutput> {
    const repository = await this.repositoryRepository.findByUuid(input.uuid);
    if (!repository) {
      throw new Error(`Repository not found: ${input.uuid}`);
    }

    repository.activate();
    await this.repositoryRepository.save(repository);

    return { repository: repository.toClientDTO() };
  }
}

