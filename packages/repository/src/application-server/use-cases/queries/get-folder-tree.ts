/**
 * Get Folder Tree
 *
 * Get folder tree锛堟寚瀹氫粨鍌級
 */

import type { IFolderRepository } from '../../../domain-server/repositories/IFolderRepository';
import { Folder } from '../../../domain-server/entities/folder';
import { FolderHierarchyService } from '../../../domain-server/services/FolderHierarchyService';
import type { FolderClientDTO } from '@dailyuse/contracts/repository';

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
 * Get Folder Tree
 */
export class GetFolderTree {
  private hierarchyService: FolderHierarchyService;

  constructor(private readonly folderRepository: IFolderRepository) {
    this.hierarchyService = new FolderHierarchyService();
  }

  async execute(input: GetFolderTreeInput): Promise<GetFolderTreeOutput> {
    const allFolders = await this.folderRepository.findByRepositoryId(input.repositoryId);
    const tree = this.hierarchyService.buildTree(allFolders);

    const convertTreeNode = (node: any): FolderClientDTO => {
      const folder = node.folder as Folder;
      const clientDTO = folder.toClientDTO(false);

      if (node.children && node.children.length > 0) {
        clientDTO.children = node.children.map((child: any) => convertTreeNode(child));
      }

      return clientDTO;
    };

    return { folders: tree.map((node) => convertTreeNode(node)) };
  }
}

