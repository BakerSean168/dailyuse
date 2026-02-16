/**
 * Update Resource Content
 *
 * Update Markdown 鍐呭
 */

import type { IResourceRepository } from '../../domain-server/repositories/IResourceRepository';
import type { IRepositoryRepository } from '../../domain-server/repositories/IRepositoryRepository';
import type { ResourceClientDTO } from '@dailyuse/contracts/repository';
import { StoragePolicy } from '../../domain-server/services/StoragePolicy';
import type { IStoragePort } from '../ports/IStoragePort';

/**
 * Update Resource Content Input
 */
export interface UpdateResourceContentInput {
  id: string;
  content: string;
}

/**
 * Update Resource Content Output
 */
export interface UpdateResourceContentOutput {
  resource: ResourceClientDTO;
}

/**
 * Update Resource Content
 */
export class UpdateResourceContent {
  private readonly policy: StoragePolicy;

  constructor(
    private readonly resourceRepository: IResourceRepository,
    private readonly repositoryRepository: IRepositoryRepository,
    private readonly storagePort: IStoragePort,
  ) {
    this.policy = new StoragePolicy();
  }

  async execute(input: UpdateResourceContentInput): Promise<UpdateResourceContentOutput> {
    const resource = await this.resourceRepository.findById(input.id);
    if (!resource) {
      throw new Error(`Resource not found: ${input.id}`);
    }

    const repository = await this.repositoryRepository.findById(String(resource.repositoryId));
    if (!repository) {
      throw new Error(`Repository not found: ${resource.repositoryId}`);
    }

    const newSize = Buffer.byteLength(input.content, 'utf8');
    const oldSize = resource.size ?? 0;
    const sizeDelta = newSize - oldSize;

    this.policy.assertFileSizeWithinLimit(newSize, {
      maxFileBytes: undefined,
    });
    this.policy.assertQuotaWithinLimit(repository.stats.totalSize, sizeDelta, {
      maxTotalBytes: undefined,
    });

    await this.storagePort.write({
      repositoryId: String(resource.repositoryId),
      path: resource.path,
      content: input.content,
      isFolder: false,
    });

    resource.updateContent({
      content: input.content,
      size: newSize,
    });
    await this.resourceRepository.save(resource);

    if (sizeDelta !== 0) {
      repository.updateStats({
        totalSize: Math.max(0, repository.stats.totalSize + sizeDelta),
      });
      await this.repositoryRepository.save(repository);
    }
    return { resource: resource.toClientDTO() };
  }
}

