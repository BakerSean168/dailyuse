/**
 * Rename Folder
 *
 * Rename folder
 */

import type { IFolderRepository } from '../../../domain-server/repositories/i-folder-repository';
import type { IResourceRepository } from '../../../domain-server/repositories/i-resource-repository';
import type { IRepositoryRepository } from '../../../domain-server/repositories/i-repository-repository';
import { FolderHierarchyService } from '../../../domain-server/services/folder-hierarchy-service';
import { PathCalculator } from '../../../domain-server/services/path-calculator';
import type { FolderClientDTO } from '@dailyuse/contracts/repository';
import type { IStoragePort } from '../../ports/i-storage-port';
import type { Result } from '@dailyuse/contracts/result';
import { ok, error } from '@dailyuse/contracts/result';

/**
 * Rename Folder Input
 */
export interface RenameFolderInput {
  id: string;
  newName: string;
}

/**
 * Rename Folder Output
 */
export interface RenameFolderOutput {
  folder: FolderClientDTO;
}

/**
 * Rename Folder Use Case
 */
export class RenameFolderUseCase {
  private hierarchyService: FolderHierarchyService;

  constructor(
    private readonly folderRepository: IFolderRepository,
    private readonly resourceRepository: IResourceRepository,
    private readonly repositoryRepository: IRepositoryRepository,
    private readonly storagePort: IStoragePort,
  ) {
    this.hierarchyService = new FolderHierarchyService();
  }

  private async updateResourcesRecursively(folderId: string, folderPath: string): Promise<void> {
    const resources = await this.resourceRepository.findByFolderId(folderId);
    for (const resource of resources) {
      const newPath = PathCalculator.buildPath(folderPath, resource.name);
      resource.moveTo(resource.folderId, newPath);
      await this.resourceRepository.save(resource);
    }

    const children = await this.folderRepository.findByParentId(folderId);
    for (const child of children) {
      await this.updateResourcesRecursively(String(child.id), child.path);
    }
  }

  async execute(input: RenameFolderInput): Promise<Result<RenameFolderOutput>> {
    const folder = await this.folderRepository.findById(input.id);
    if (!folder) {
      return error('NOT_FOUND', `Folder not found: ${input.id}`);
    }

    const repository = await this.repositoryRepository.findById(folder.repositoryId);
    if (!repository) {
      return error('NOT_FOUND', `Repository not found: ${folder.repositoryId}`);
    }

    const previousPath = folder.path;
    folder.rename(input.newName);

    await this.storagePort.move({
      repositoryId: String(repository.id),
      fromPath: previousPath,
      toPath: folder.path,
      isFolder: true,
    });

    await this.folderRepository.save(folder);

    await this.hierarchyService.updateChildrenPaths(
      String(folder.id),
      folder.path,
      this.folderRepository,
    );

    await this.updateResourcesRecursively(String(folder.id), folder.path);

    return ok({ folder: folder.toClientDTO() as unknown as FolderClientDTO });
  }
}
