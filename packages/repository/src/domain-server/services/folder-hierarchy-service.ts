/**
 * 文件夹层级管理领域服务
 */
import type { Folder } from '../entities/folder';
import type { IFolderRepository } from '../repositories/i-folder-repository';

export interface FolderTreeNode {
  folder: Folder;
  children: FolderTreeNode[];
}

export class FolderHierarchyService {
  /**
   * 检测循环引用
   */
  async detectCycle(
    folderId: string,
    newParentId: string,
    folderRepository: IFolderRepository,
  ): Promise<boolean> {
    let currentId: string | null = newParentId;
    const visited = new Set<string>();
    let depth = 0;
    const MAX_DEPTH = 50;

    while (currentId && depth < MAX_DEPTH) {
      if (currentId === folderId) {
        return true;
      }

      if (visited.has(currentId)) {
        return true;
      }
      visited.add(currentId);

      const parent = await folderRepository.findById(currentId);
      if (!parent) {
        break;
      }

      currentId = parent.parentId;
      depth++;
    }

    return depth >= MAX_DEPTH;
  }

  /**
   * 级联更新子文件夹路径
   */
  async updateChildrenPaths(
    folderId: string,
    newPath: string,
    folderRepository: IFolderRepository,
  ): Promise<void> {
    const children = await folderRepository.findByParentId(folderId);

    for (const child of children) {
      const childNewPath = `${newPath}/${child.name}`;
      child.updatePath(childNewPath);
      await folderRepository.save(child);

      await this.updateChildrenPaths(String(child.id), childNewPath, folderRepository);
    }
  }

  /**
   * 构建文件夹树
   */
  buildTree(folders: Folder[]): FolderTreeNode[] {
    const folderMap = new Map<string, FolderTreeNode>();
    const rootFolders: FolderTreeNode[] = [];

    for (const folder of folders) {
      folderMap.set(String(folder.id), {
        folder,
        children: [],
      });
    }

    for (const folder of folders) {
      const node = folderMap.get(String(folder.id))!;

      if (folder.parentId) {
        const parentNode = folderMap.get(folder.parentId);
        if (parentNode) {
          parentNode.children.push(node);
        } else {
          rootFolders.push(node);
        }
      } else {
        rootFolders.push(node);
      }
    }

    return rootFolders;
  }
}
