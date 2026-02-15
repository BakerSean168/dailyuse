/**
 * Create Folder
 *
 * Create folder
 */

import type { IFolderRepository } from '../../domain-server/repositories/IFolderRepository';
import type { IRepositoryRepository } from '../../domain-server/repositories/IRepositoryRepository';
import { Folder } from '../../domain-server/entities/folder';
import type { FolderClientDTO, FolderMetadataServerDTO } from '@dailyuse/contracts/repository';
import type { IStoragePort } from '../ports/IStoragePort';

/**
 * Create Folder Input
 */
export interface CreateFolderInput {
  repositoryUuid: string;
  parentUuid?: string | null;
  name: string;
  order?: number;
  metadata?: Partial<FolderMetadataServerDTO>;
}

/**
 * Create Folder Output
 */
export interface CreateFolderOutput {
  folder: FolderClientDTO;
}

/**
 * Create Folder
 */
export class CreateFolder {
  constructor(
    private readonly folderRepository: IFolderRepository,
    private readonly repositoryRepository: IRepositoryRepository,
    private readonly storagePort: IStoragePort,
  ) {}

  async execute(input: CreateFolderInput): Promise<CreateFolderOutput> {
    const repository = await this.repositoryRepository.findById(input.repositoryUuid);
    if (!repository) {
      throw new Error(`Repository not found: ${input.repositoryUuid}`);
    }

    let parentPath: string | null = null;
    if (input.parentUuid) {
      const parent = await this.folderRepository.findById(input.parentUuid);
      if (!parent) {
        throw new Error(`Parent folder not found: ${input.parentUuid}`);
      }
      if (parent.repositoryId !== input.repositoryUuid) {
        throw new Error('Parent folder does not belong to the target repository');
      }
      parentPath = parent.path;
    }

    const folder = Folder.create({
      repositoryId: input.repositoryUuid,
      parentId: input.parentUuid,
      name: input.name,
      parentPath,
      order: input.order,
      metadata: input.metadata,
    });

    await this.storagePort.write({
      repositoryId: input.repositoryUuid,
      path: folder.path,
      isFolder: true,
    });

    await this.folderRepository.save(folder);
    repository.recordFolderAdded();
    await this.repositoryRepository.save(repository);

    return { folder: folder.toClientDTO() };
  }
}

