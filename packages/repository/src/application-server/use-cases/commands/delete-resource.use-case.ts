/**
 * Delete Resource
 *
 * Delete asset
 */

import type { IResourceRepository } from '../../../domain-server/repositories/i-resource-repository';
import type { IRepositoryRepository } from '../../../domain-server/repositories/i-repository-repository';
import type { IStoragePort } from '../../ports/i-storage-port';
import type { Result } from '@dailyuse/contracts/result';
import { ok, error } from '@dailyuse/contracts/result';

/**
 * Delete Resource Input
 */
export interface DeleteResourceInput {
  id: string;
}

/**
 * Delete Resource Use Case
 */
export class DeleteResourceUseCase {
  constructor(
    private readonly resourceRepository: IResourceRepository,
    private readonly repositoryRepository: IRepositoryRepository,
    private readonly storagePort: IStoragePort,
  ) {}

  async execute(input: DeleteResourceInput): Promise<Result<void>> {
    const resource = await this.resourceRepository.findById(input.id);
    if (!resource) {
      return error('NOT_FOUND', `Resource not found: ${input.id}`);
    }

    const repository = await this.repositoryRepository.findById(String(resource.repositoryId));
    if (!repository) {
      return error('NOT_FOUND', `Repository not found: ${resource.repositoryId}`);
    }

    await this.storagePort.delete({
      repositoryId: String(resource.repositoryId),
      path: resource.path,
      isFolder: resource.isFolder(),
    });

    await this.resourceRepository.delete(String(resource.id));

    if (resource.isFolder()) {
      repository.recordFolderRemoved();
    } else {
      repository.recordResourceRemoved(resource.size ?? 0);
    }
    await this.repositoryRepository.save(repository);

    return ok(undefined);
  }
}
