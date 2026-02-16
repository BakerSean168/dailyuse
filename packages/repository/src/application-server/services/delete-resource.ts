/**
 * Delete Resource
 *
 * Delete asset
 */

import type { IResourceRepository } from '../../domain-server/repositories/IResourceRepository';
import type { IRepositoryRepository } from '../../domain-server/repositories/IRepositoryRepository';
import type { IStoragePort } from '../ports/IStoragePort';

/**
 * Delete Resource Input
 */
export interface DeleteResourceInput {
  id: string;
}

/**
 * Delete Resource
 */
export class DeleteResource {
  constructor(
    private readonly resourceRepository: IResourceRepository,
    private readonly repositoryRepository: IRepositoryRepository,
    private readonly storagePort: IStoragePort,
  ) {}

  async execute(input: DeleteResourceInput): Promise<void> {
    const resource = await this.resourceRepository.findById(input.id);
    if (!resource) {
      throw new Error(`Resource not found: ${input.id}`);
    }

    const repository = await this.repositoryRepository.findById(String(resource.repositoryId));
    if (!repository) {
      throw new Error(`Repository not found: ${resource.repositoryId}`);
    }

    await this.storagePort.delete({
      repositoryId: String(resource.repositoryId),
      path: resource.path,
      isFolder: resource.isFolder(),
    });

    resource.delete();
    await this.resourceRepository.save(resource);

    if (resource.isFolder()) {
      repository.recordFolderRemoved();
    } else {
      repository.recordResourceRemoved(resource.size ?? 0);
    }
    await this.repositoryRepository.save(repository);
  }
}

