/**
 * 文件树节点类型
 * 用于统一渲染文件夹和文件
 */

export type TreeNodeType = 'folder' | 'file';

/**
 * 树节点接口
 * 可以表示文件夹或文件
 */
export interface TreeNode {
  uuid: string;
  name: string;
  type: TreeNodeType;
  parentUuid: string | null;
  repositoryUuid: string;
  path: string;

  // 文件夹特有属性
  children?: TreeNode[];
  isExpanded?: boolean;

  // 文件特有属性
  extension?: string;
  size?: number;
  updatedAt?: Date;

  // YAML frontmatter (仅文件)
  metadata?: {
    title?: string;
    tags?: string[];
    created?: Date;
    updated?: Date;
    [key: string]: any;
  };
}

/**
 * 文件树 API 响应
 */
export interface FileTreeResponse {
  repositoryUuid: string;
  tree: TreeNode[];
}
