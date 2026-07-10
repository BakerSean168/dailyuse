import type { FolderMetadataDTO } from '../value-objects/folder-metadata';
import type { FolderId, IdentityId, RepositoryId } from '../../../primitives';

/**
 * Folder Server DTO
 *
 * 服务端持久化/传输形状：包含多租户所需的 `identityId`，不含仅前端使用的
 * UI 计算字段（depth/isRoot/displayName 等）。客户端形状见 {@link FolderClientDTO}。
 */
export interface FolderServerDTO {
  id: FolderId;
  repositoryId: RepositoryId;
  identityId: IdentityId;
  parentId: FolderId | null;
  name: string;
  path: string;
  order: number;
  isExpanded: boolean;
  metadata: FolderMetadataDTO;
  createdAt: number;
  updatedAt: number;
  children?: FolderServerDTO[] | null;
}

export interface FolderClientDTO {
  id: FolderId;
  repositoryId: RepositoryId;
  parentId: FolderId | null;
  name: string;
  path: string;
  order: number;
  isExpanded: boolean;
  metadata: FolderMetadataDTO;
  createdAt: number;
  updatedAt: number;
  children?: FolderClientDTO[] | null;
  depth: number;
  isRoot: boolean;
  hasChildren: boolean;
  pathParts: string[];
  displayName: string;
  createdAtText: string;
  updatedAtText: string;
}
