/**
 * Create Resource
 *
 * Create resource
 */

import { Resource } from '../../../domain-server/entities/resource';
import type { IResourceRepository } from '../../../domain-server/repositories/i-resource-repository';
import type { IRepositoryRepository } from '../../../domain-server/repositories/i-repository-repository';
import type { ResourceClientDTO } from '@dailyuse/contracts/repository';
import { ResourceType } from '@dailyuse/contracts/repository';
import { RepositoryId } from '../../../domain-shared/value-objects/repository-id';
import { FolderId } from '../../../domain-shared/value-objects/folder-id';
import { StoragePolicy } from '../../../domain-server/services/storage-policy';
import type { IStoragePort } from '../../ports/i-storage-port';
import type { Result } from '@dailyuse/contracts/result';
import { ok, error } from '@dailyuse/contracts/result';
import matter from 'gray-matter';

/**
 * Create Resource Input
 */
export interface CreateResourceInput {
  repositoryId: string;
  identityId: string;
  folderId?: string;
  name: string;
  type: ResourceType;
  path: string;
  content?: string;
  binaryContent?: Uint8Array;
  mimeType?: string;
  metadata?: Record<string, unknown>;
  maxFileBytes?: number;
  maxTotalBytes?: number;
  forbiddenExtensions?: string[];
}

/**
 * Create Resource Output
 */
export interface CreateResourceOutput {
  resource: ResourceClientDTO;
}

/**
 * Create Resource Use Case
 */
export class CreateResourceUseCase {
  private readonly policy: StoragePolicy;

  constructor(
    private readonly resourceRepository: IResourceRepository,
    private readonly repositoryRepository: IRepositoryRepository,
    private readonly storagePort: IStoragePort,
  ) {
    this.policy = new StoragePolicy();
  }

  async execute(input: CreateResourceInput): Promise<Result<CreateResourceOutput>> {
    const repository = await this.repositoryRepository.findById(input.repositoryId);
    if (!repository) {
      return error('NOT_FOUND', `Repository not found: ${input.repositoryId}`);
    }

    const exists = await this.resourceRepository.existsByPath(input.repositoryId, input.path);
    if (exists) {
      return error('CONFLICT', `Resource already exists at path: ${input.path}`);
    }

    const storageContent = input.binaryContent ?? input.content ?? null;
    const contentBytes =
      typeof storageContent === 'string'
        ? Buffer.byteLength(storageContent, 'utf8')
        : (storageContent?.byteLength ?? 0);

    let metadataOverrides: Record<string, unknown> = { ...(input.metadata ?? {}) };
    if (input.type === ResourceType.File) {
      this.policy.assertExtensionAllowed(input.name, {
        forbiddenExtensions: input.forbiddenExtensions,
      });
      this.policy.assertFileSizeWithinLimit(contentBytes, {
        maxFileBytes: input.maxFileBytes,
      });
      this.policy.assertQuotaWithinLimit(repository.stats.totalSize, contentBytes, {
        maxTotalBytes: input.maxTotalBytes,
      });

      if (input.name.endsWith('.md') && input.content) {
        try {
          const parsed = matter(input.content);
          if (parsed.data) {
            metadataOverrides = {
              tags: Array.isArray(parsed.data.tags)
                ? parsed.data.tags.map(String)
                : typeof parsed.data.tags === 'string'
                  ? [parsed.data.tags]
                  : [],
              thumbnail: parsed.data.thumbnail ?? parsed.data.cover ?? null,
            };
          }
        } catch (_e) {
          // ignore parsing errors
        }
      }
    }

    const resource = Resource.create({
      repositoryId: RepositoryId.of(input.repositoryId),
      identityId: input.identityId,
      folderId: input.folderId ? FolderId.of(input.folderId) : null,
      name: input.name,
      type: input.type,
      path: input.path,
      mimeType: input.mimeType ?? null,
      content: input.binaryContent ? null : (input.content ?? null),
      size: input.type === ResourceType.File ? contentBytes : null,
      metadata: metadataOverrides,
      allowedExtensions: null,
    });

    await this.storagePort.write({
      repositoryId: input.repositoryId,
      path: input.path,
      content: storageContent,
      isFolder: input.type === ResourceType.Folder,
    });

    await this.resourceRepository.save(resource);

    if (resource.isFolder()) {
      repository.recordFolderAdded();
    } else {
      repository.recordResourceAdded(contentBytes);
    }
    await this.repositoryRepository.save(repository);

    return ok({ resource: resource.toClientDTO() });
  }
}
