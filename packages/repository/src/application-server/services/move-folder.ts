/**
 * Move Folder
 *
 * 绉诲姩鏂囦欢澶?
 */

import type { IFolderRepository } from '@/domain-server';
import { FolderHierarchyService } from '@/domain-server';
import type { FolderClientDTO } from '@dailyuse/contracts/repository';

/**
 * Move Folder Input
 */
export interface MoveFolderInput {
  uuid: string;
  newParentUuid: string | null;
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

  constructor(private readonly folderRepository: IFolderRepository) {
    this.hierarchyService = new FolderHierarchyService();
  }

  async execute(input: MoveFolderInput): Promise<MoveFolderOutput> {
    const folder = await this.folderRepository.findByUuid(input.uuid);
    if (!folder) {
      throw new Error(`Folder not found: ${input.uuid}`);
    }

    if (input.newParentUuid) {
      const hasCycle = await this.hierarchyService.detectCycle(
        folder.uuid,
        input.newParentUuid,
        this.folderRepository,
      );
      if (hasCycle) {
        throw new Error('Circular reference detected');
      }
    }

    let newParentPath: string | null = null;
    if (input.newParentUuid) {
      const newParent = await this.folderRepository.findByUuid(input.newParentUuid);
      if (!newParent) {
        throw new Error(`New parent folder not found: ${input.newParentUuid}`);
      }
      newParentPath = newParent.path;
    }

    folder.moveTo(input.newParentUuid, newParentPath ?? undefined);
    await this.folderRepository.save(folder);

    await this.hierarchyService.updateChildrenPaths(
      folder.uuid,
      folder.path,
      this.folderRepository,
    );

    return { folder: folder.toClientDTO() };
  }
}

