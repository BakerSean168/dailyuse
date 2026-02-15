/**
 * Rename Folder
 *
 * 閲嶅懡鍚嶆枃浠跺す
 */

import type { IFolderRepository } from '../../domain-server/repositories/IFolderRepository';
import type { IResourceRepository } from '../../domain-server/repositories/IResourceRepository';
import type { IRepositoryRepository } from '../../domain-server/repositories/IRepositoryRepository';
import { FolderHierarchyService } from '../../domain-server/services/FolderHierarchyService';
import { PathCalculator } from '../../domain-server/services/PathCalculator';
import type { FolderClientDTO } from '@dailyuse/contracts/repository';
import type { IStoragePort } from '../ports/IStoragePort';

/**
 * Rename Folder Input
 */
export interface RenameFolderInput {
  uuid: string;
  newName: string;
}

/**
 * Rename Folder Output
 */
export interface RenameFolderOutput {
  folder: FolderClientDTO;
}

/**
 * Rename Folder
 */
export class RenameFolder {
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

  async execute(input: RenameFolderInput): Promise<RenameFolderOutput> {
    const folder = await this.folderRepository.findById(input.uuid);
    if (!folder) {
      throw new Error(`Folder not found: ${input.uuid}`);
    }

    const repository = await this.repositoryRepository.findById(folder.repositoryId);
    if (!repository) {
      throw new Error(`Repository not found: ${folder.repositoryId}`);
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

    return { folder: folder.toClientDTO() };
  }
}

