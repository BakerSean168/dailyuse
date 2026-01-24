/**
 * Delete Repository
 *
 * Delete repository
 */

import type { IRepositoryRepository } from '@dailyuse/domain-server/repository';

/**
 * Delete Repository Input
 */
export interface DeleteRepositoryInput {
  uuid: string;
}

/**
 * Delete Repository
 */
export class DeleteRepository {

  constructor(private readonly repositoryRepository: IRepositoryRepository) {}

  async execute(input: DeleteRepositoryInput): Promise<void> {
    const repository = await this.repositoryRepository.findByUuid(input.uuid);
    if (!repository) {
      throw new Error(`Repository not found: ${input.uuid}`);
    }

    repository.delete();
    await this.repositoryRepository.save(repository);
  }
}

