/**
 * Rename Folder
 *
 * 重命名文件夹
 */

import type { IFolderRepository } from '@dailyuse/domain-server/repository';
import { FolderHierarchyService } from '@dailyuse/domain-server/repository';
import type { FolderClientDTO } from '@dailyuse/contracts/repository';

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

  constructor(private readonly folderRepository: IFolderRepository) {
    this.hierarchyService = new FolderHierarchyService();
  }

  async execute(input: RenameFolderInput): Promise<RenameFolderOutput> {
    const folder = await this.folderRepository.findByUuid(input.uuid);
    if (!folder) {
      throw new Error(`Folder not found: ${input.uuid}`);
    }

    folder.rename(input.newName);
    await this.folderRepository.save(folder);

    await this.hierarchyService.updateChildrenPaths(
      folder.uuid,
      folder.path,
      this.folderRepository,
    );

    return { folder: folder.toClientDTO() };
  }
}
