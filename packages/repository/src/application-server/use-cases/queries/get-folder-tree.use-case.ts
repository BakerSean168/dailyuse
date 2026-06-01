/**
 * Get Folder Tree
 *
 * Get folder tree
 */

import type { IFolderRepository } from '../../../domain-server/repositories/i-folder-repository';
import { FolderHierarchyService } from '../../../domain-server/services/folder-hierarchy-service';
import type { FolderTreeNode } from '../../../domain-server/services/folder-hierarchy-service';
import type { FolderClientDTO } from '../../../domain-server/entities/folder';
import type { Result } from '@dailyuse/contracts/result';
import { ok } from '@dailyuse/contracts/result';

/**
 * Get Folder Tree Input
 */
export interface GetFolderTreeInput {
  repositoryId: string;
}

/**
 * Get Folder Tree Output
 */
export interface GetFolderTreeOutput {
  folders: FolderClientDTO[];
}

/**
 * Get Folder Tree Use Case
 */
export class GetFolderTreeUseCase {
  private hierarchyService: FolderHierarchyService;

  constructor(private readonly folderRepository: IFolderRepository) {
    this.hierarchyService = new FolderHierarchyService();
  }

  async execute(input: GetFolderTreeInput): Promise<Result<GetFolderTreeOutput>> {
    const allFolders = await this.folderRepository.findByRepositoryId(input.repositoryId);
    const tree = this.hierarchyService.buildTree(allFolders);

    const convertTreeNode = (node: FolderTreeNode): FolderClientDTO => {
      const folder = node.folder;
      const clientDTO = folder.toClientDTO(false);

      if (node.children && node.children.length > 0) {
        clientDTO.children = node.children.map((child) => convertTreeNode(child));
      }

      return clientDTO;
    };

    return ok({ folders: tree.map((node) => convertTreeNode(node)) });
  }
}
