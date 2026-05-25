/**
 * Update Resource Content
 *
 * Update resource content
 */

import type { IResourceRepository } from '../../../domain-server/repositories/i-resource-repository';
import type { IRepositoryRepository } from '../../../domain-server/repositories/i-repository-repository';
import type { ResourceClientDTO } from '@dailyuse/contracts/repository';
import { StoragePolicy } from '../../../domain-server/services/storage-policy';
import type { IStoragePort } from '../../ports/i-storage-port';
import type { Result } from '@dailyuse/contracts/result';
import { ok, error } from '@dailyuse/contracts/result';
import matter from 'gray-matter';

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
 * Update Resource Content Use Case
 */
export class UpdateResourceContentUseCase {
  private readonly policy: StoragePolicy;

  constructor(
    private readonly resourceRepository: IResourceRepository,
    private readonly repositoryRepository: IRepositoryRepository,
    private readonly storagePort: IStoragePort,
  ) {
    this.policy = new StoragePolicy();
  }

  async execute(input: UpdateResourceContentInput): Promise<Result<UpdateResourceContentOutput>> {
    const resource = await this.resourceRepository.findById(input.id);
    if (!resource) {
      return error('NOT_FOUND', `Resource not found: ${input.id}`);
    }

    const repository = await this.repositoryRepository.findById(String(resource.repositoryId));
    if (!repository) {
      return error('NOT_FOUND', `Repository not found: ${resource.repositoryId}`);
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

    let metadataOverrides = {};
    if (resource.name.endsWith('.md')) {
      try {
        const parsed = matter(input.content);
        if (parsed.data) {
          metadataOverrides = {
            tags: Array.isArray(parsed.data.tags)
              ? parsed.data.tags.map(String)
              : (typeof parsed.data.tags === 'string' ? [parsed.data.tags] : []),
            thumbnail: parsed.data.thumbnail ?? parsed.data.cover ?? null,
          };
        }
      } catch (e) {
        // ignore parsing errors
      }
    }

    resource.updateContent({
      content: input.content,
      size: newSize,
      metadata: metadataOverrides,
    });
    await this.resourceRepository.save(resource);

    if (sizeDelta !== 0) {
      repository.updateStats({
        totalSize: Math.max(0, repository.stats.totalSize + sizeDelta),
      });
      await this.repositoryRepository.save(repository);
    }
    return ok({ resource: resource.toClientDTO() });
  }
}
