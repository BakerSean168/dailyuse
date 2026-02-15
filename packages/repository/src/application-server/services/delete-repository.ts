/**
 * Delete Repository
 *
 * Delete repository
 */

import type { IRepositoryRepository } from '../../domain-server/repositories/IRepositoryRepository';

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
    const repository = await this.repositoryRepository.findById(input.uuid);
    if (!repository) {
      throw new Error(`Repository not found: ${input.uuid}`);
    }

    repository.delete();
    await this.repositoryRepository.save(repository);
  }
}

