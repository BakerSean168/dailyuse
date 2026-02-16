/**
 * Move Folder
 *
 * 绉诲姩鏂囦欢澶?
 */

import type { IFolderRepository } from '../../domain-server/repositories/IFolderRepository';
import type { IResourceRepository } from '../../domain-server/repositories/IResourceRepository';
import type { IRepositoryRepository } from '../../domain-server/repositories/IRepositoryRepository';
import { FolderHierarchyService } from '../../domain-server/services/FolderHierarchyService';
import { PathCalculator } from '../../domain-server/services/PathCalculator';
import type { FolderClientDTO } from '@dailyuse/contracts/repository';
import type { IStoragePort } from '../ports/IStoragePort';

/**
 * Move Folder Input
 */
export interface MoveFolderInput {
  id: string;
  newParentId: string | null;
}

/**
 * Move Folder Output
 */
export interface MoveFolderOutput {
  folder: FolderClientDTO;
}

/**
 * Move Folder
 */
export class MoveFolder {
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

  async execute(input: MoveFolderInput): Promise<MoveFolderOutput> {
    const folder = await this.folderRepository.findById(input.id);
    if (!folder) {
      throw new Error(`Folder not found: ${input.id}`);
    }

    const repository = await this.repositoryRepository.findById(folder.repositoryId);
    if (!repository) {
      throw new Error(`Repository not found: ${folder.repositoryId}`);
    }

    if (input.newParentId) {
      const hasCycle = await this.hierarchyService.detectCycle(
        String(folder.id),
        input.newParentId,
        this.folderRepository,
      );
      if (hasCycle) {
        throw new Error('Circular reference detected');
      }
    }

    let newParentPath: string | null = null;
    if (input.newParentId) {
      const newParent = await this.folderRepository.findById(input.newParentId);
      if (!newParent) {
        throw new Error(`New parent folder not found: ${input.newParentId}`);
      }
      if (newParent.repositoryId !== folder.repositoryId) {
        throw new Error('New parent folder does not belong to the same repository');
      }
      newParentPath = newParent.path;
    }

    const previousPath = folder.path;
    folder.moveTo(input.newParentId, newParentPath ?? undefined);

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

