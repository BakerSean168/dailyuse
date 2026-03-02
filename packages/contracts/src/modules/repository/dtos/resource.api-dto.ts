/**
 * Resource DTOs
 */

import type { ResourceId, RepositoryId } from '../../../primitives';

export interface ResourceDTO {
  id: ResourceId;
  repositoryId: RepositoryId;
  name: string;
  type: 'FILE' | 'FOLDER'; // 逻辑上区分，方便前端渲染文件夹图标
  mimeType: string;
  size: number;

  // 预览地址 (由后端动态生成，可能是带签名或临时 Token 的 URL)
  previewUrl: string | null;

  // 统计信息
  versionCount: number;

  createdAt: string;
  updatedAt: string;
}

/**
 * 前端文件树专用结构
 */
export interface FileNodeDTO {
  id: ResourceId;
  name: string;
  type: 'FILE' | 'FOLDER';
  children?: FileNodeDTO[]; // 递归结构
}
