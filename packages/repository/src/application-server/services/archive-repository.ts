/**
 * Archive Repository
 *
 * 褰掓。Repository
 */

import type { IRepositoryRepository } from '../../domain-server/repositories/IRepositoryRepository';
import type { RepositoryClientDTO } from '@dailyuse/contracts/repository';

/**
 * Archive Repository Input
 */
export interface ArchiveRepositoryInput {
  uuid: string;
}

/**
 * Archive Repository Output
 */
export interface ArchiveRepositoryOutput {
  repository: RepositoryClientDTO;
}

/**
 * Archive Repository
 */
export class ArchiveRepository {
  constructor(private readonly repositoryRepository: IRepositoryRepository) {}

  async execute(input: ArchiveRepositoryInput): Promise<ArchiveRepositoryOutput> {
    const repository = await this.repositoryRepository.findByUuid(input.uuid);
    if (!repository) {
      throw new Error(`Repository not found: ${input.uuid}`);
    }

    repository.archive();
    await this.repositoryRepository.save(repository);

    return { repository: repository.toClientDTO() };
  }
}

