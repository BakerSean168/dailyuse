/**
 * Delete Folder
 *
 * Deletes a folder tree from storage and persistence.
 */

import type { IFolderRepository } from '../../../domain/repositories/i-folder-repository';
import type { IResourceRepository } from '../../../domain/repositories/i-resource-repository';
import type { IRepositoryRepository } from '../../../domain/repositories/i-repository-repository';
import type { IStoragePort } from '../../ports/i-storage-port';
import type { Folder } from '../../../domain/entities/folder';
import type { Result } from '@dailyuse/contracts/result';
import { ok, error } from '@dailyuse/contracts/result';

/**
 * Delete Folder Input
 */
export interface DeleteFolderInput {
  id: string;
}

/**
 * Delete Folder Use Case
 */
export class DeleteFolderUseCase {
  constructor(
    private readonly folderRepository: IFolderRepository,
    private readonly resourceRepository: IResourceRepository,
    private readonly repositoryRepository: IRepositoryRepository,
    private readonly storagePort: IStoragePort,
  ) {}

  async execute(input: DeleteFolderInput): Promise<Result<void>> {
    const folder = await this.folderRepository.findById(input.id);
    if (!folder) {
      return error('NOT_FOUND', `Folder not found: ${input.id}`);
    }

    const repository = await this.repositoryRepository.findById(folder.repositoryId);
    if (!repository) {
      return error('NOT_FOUND', `Repository not found: ${folder.repositoryId}`);
    }

    const collectFolders = async (root: Folder): Promise<Folder[]> => {
      const folders: Folder[] = [root];
      const children = await this.folderRepository.findByParentId(String(root.id));

      for (const child of children) {
        const descendants = await collectFolders(child);
        folders.push(...descendants);
      }

      return folders;
    };

    const foldersToDelete = await collectFolders(folder);
    const resourcesToDelete: string[] = [];

    for (const current of foldersToDelete) {
      const resources = await this.resourceRepository.findByFolderId(String(current.id));
      for (const resource of resources) {
        resourcesToDelete.push(String(resource.id));
        repository.recordResourceRemoved(resource.size ?? 0);
      }
    }

    await this.storagePort.delete({
      repositoryId: String(repository.id),
      path: folder.path,
      isFolder: true,
    });

    for (const resourceId of resourcesToDelete) {
      await this.resourceRepository.delete(resourceId);
    }

    for (const current of foldersToDelete.reverse()) {
      await this.folderRepository.delete(String(current.id));
      repository.recordFolderRemoved();
    }

    await this.repositoryRepository.save(repository);

    return ok(undefined);
  }
}
