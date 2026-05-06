/**
 * Get Folder Tree
 *
 * Get folder tree
 */

import type { IFolderRepository } from '../../../domain-server/repositories/IFolderRepository';
import { Folder } from '../../../domain-server/entities/folder';
import { FolderHierarchyService } from '../../../domain-server/services/FolderHierarchyService';
import type { FolderClientDTO } from '@dailyuse/contracts/repository';
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

    const convertTreeNode = (node: any): FolderClientDTO => {
      const folder = node.folder as Folder;
      const clientDTO = folder.toClientDTO(false);

      if (node.children && node.children.length > 0) {
        clientDTO.children = node.children.map((child: any) => convertTreeNode(child));
      }

      return clientDTO as unknown as FolderClientDTO;
    };

    return ok({ folders: tree.map((node) => convertTreeNode(node)) });
  }
}
