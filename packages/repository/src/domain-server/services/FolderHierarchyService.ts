/**
 * 文件夹层级管理领域服务
 */
import type { Folder } from '../entities/folder';
import type { IFolderRepository } from '../repositories/IFolderRepository';

export interface FolderTreeNode {
  folder: Folder;
  children: FolderTreeNode[];
}

export class FolderHierarchyService {
  /**
   * 检测循环引用
   */
  async detectCycle(
    folderUuid: string,
    newParentUuid: string,
    folderRepository: IFolderRepository,
  ): Promise<boolean> {
    let currentUuid: string | null = newParentUuid;
    const visited = new Set<string>();
    let depth = 0;
    const MAX_DEPTH = 50;

    while (currentUuid && depth < MAX_DEPTH) {
      if (currentUuid === folderUuid) {
        return true;
      }

      if (visited.has(currentUuid)) {
        return true;
      }
      visited.add(currentUuid);

      const parent = await folderRepository.findByUuid(currentUuid);
      if (!parent) {
        break;
      }

      currentUuid = parent.parentId;
      depth++;
    }

    return depth >= MAX_DEPTH;
  }

  /**
   * 级联更新子文件夹路径
   */
  async updateChildrenPaths(
    folderUuid: string,
    newPath: string,
    folderRepository: IFolderRepository,
  ): Promise<void> {
    const children = await folderRepository.findByParentUuid(folderUuid);

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
