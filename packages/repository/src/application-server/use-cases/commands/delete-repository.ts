/**
 * Delete Repository
 *
 * Delete repository
 */

import type { IRepositoryRepository } from '../../../domain-server/repositories/IRepositoryRepository';

/**
 * Delete Repository Input
 */
export interface DeleteRepositoryInput {
  id: string;
}

/**
 * Delete Repository
 */
export class DeleteRepository {

  constructor(private readonly repositoryRepository: IRepositoryRepository) {}

  async execute(input: DeleteRepositoryInput): Promise<void> {
    const repository = await this.repositoryRepository.findById(input.id);
    if (!repository) {
      throw new Error(`Repository not found: ${input.id}`);
    }

    repository.delete();
    await this.repositoryRepository.save(repository);
  }
}

