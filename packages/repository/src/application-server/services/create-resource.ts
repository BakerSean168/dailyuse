/**
 * Create Resource
 *
 * Create resource
 */

import { Resource } from '../../domain-server/entities/resource';
import type { IResourceRepository } from '../../domain-server/repositories/IResourceRepository';
import type { IRepositoryRepository } from '../../domain-server/repositories/IRepositoryRepository';
import type { ResourceClientDTO } from '@dailyuse/contracts/repository';
import { ResourceType } from '@dailyuse/contracts/repository';
import { RepositoryId } from '../../domain-shared/value-objects/repository-id';
import { FolderId } from '../../domain-shared/value-objects/folder-id';
import { StoragePolicy } from '../../domain-server/services/StoragePolicy';
import type { IStoragePort } from '../ports/IStoragePort';

/**
 * Create Resource Input
 */
export interface CreateResourceInput {
  repositoryUuid: string;
  folderUuid?: string;
  name: string;
  type: ResourceType;
  path: string;
  content?: string;
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
 * Create Resource
 */
export class CreateResource {
  private readonly policy: StoragePolicy;

  constructor(
    private readonly resourceRepository: IResourceRepository,
    private readonly repositoryRepository: IRepositoryRepository,
    private readonly storagePort: IStoragePort,
  ) {
    this.policy = new StoragePolicy();
  }

  async execute(input: CreateResourceInput): Promise<CreateResourceOutput> {
    const repository = await this.repositoryRepository.findById(input.repositoryUuid);
    if (!repository) {
      throw new Error(`Repository not found: ${input.repositoryUuid}`);
    }

    const exists = await this.resourceRepository.existsByPath(input.repositoryUuid, input.path);
    if (exists) {
      throw new Error(`Resource already exists at path: ${input.path}`);
    }

    const contentBytes = input.content ? Buffer.byteLength(input.content, 'utf8') : 0;
    if (input.type === ResourceType.FILE) {
      this.policy.assertExtensionAllowed(input.name, {
        forbiddenExtensions: input.forbiddenExtensions,
      });
      this.policy.assertFileSizeWithinLimit(contentBytes, {
        maxFileBytes: input.maxFileBytes,
      });
      this.policy.assertQuotaWithinLimit(repository.stats.totalSize, contentBytes, {
        maxTotalBytes: input.maxTotalBytes,
      });
    }

    const resource = Resource.create({
      repositoryId: RepositoryId.of(input.repositoryUuid),
      folderId: input.folderUuid ? FolderId.of(input.folderUuid) : null,
      name: input.name,
      type: input.type,
      path: input.path,
      content: input.content ?? null,
      size: input.type === ResourceType.FILE ? contentBytes : null,
      allowedExtensions: null,
    });

    await this.storagePort.write({
      repositoryId: input.repositoryUuid,
      path: input.path,
      content: input.content ?? null,
      isFolder: input.type === ResourceType.FOLDER,
    });

    await this.resourceRepository.save(resource);

    if (resource.isFolder()) {
      repository.recordFolderAdded();
    } else {
      repository.recordResourceAdded(contentBytes);
    }
    await this.repositoryRepository.save(repository);

    return { resource: resource.toClientDTO() };
  }
}

