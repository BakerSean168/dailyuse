/**
 * Folder Entity - Client Interface
 * 文件夹实�?- 客户端接�?
 */
import type { FolderId, RepositoryId, DomainDate, TransferDate } from '@/primitives';
import type { FolderServerDTO } from './folder-server';
import type { FolderMetadataClient, FolderMetadataClientDTO } from '../value-objects';

// ============ DTO 定义 ============

/**
 * Folder Client DTO
 */
export interface FolderClientDTO {
  id: string;
  repositoryId: string;
  parentId: string | null;
  name: string;
  path: string;
  order: number;
  isExpanded: boolean;
  metadata: FolderMetadataClientDTO;
  createdAt: TransferDate;
  updatedAt: TransferDate;

  // 子文件夹
  children: FolderClientDTO[] | null;

  // UI 计算字段
  depth: number; // 文件夹层级深�?
  isRoot: boolean;
  hasChildren: boolean;
  pathParts: string[];
  displayName: string;
  createdAtText: string;
  updatedAtText: string;
}

// ============ 实体接口 ============

/**
 * Folder 实体 - Client 接口（实例方法）
 */
export interface FolderClient {
  // 基础属�?
  id: FolderId;
  repositoryId: RepositoryId;
  parentId: FolderId | null;
  name: string;
  path: string;
  order: number;
  isExpanded: boolean;
  metadata: FolderMetadataClient;
  createdAt: DomainDate;
  updatedAt: DomainDate;

  // 子文件夹
  children: FolderClient[] | null;

  // UI 计算属�?
  depth: number;
  isRoot: boolean;
  hasChildren: boolean;
  pathParts: string[];
  displayName: string;
  createdAtText: string;
  updatedAtText: string;

  // 方法
  rename(newName: string): void;
  moveTo(newParentId: FolderId | null, newParentPath?: string): void;
  updateMetadata(metadata: Partial<FolderMetadataClient>): void;
  setExpanded(isExpanded: boolean): void;

  // DTO 转换方法
  toClientDTO(includeChildren?: boolean): FolderClientDTO;
  toServerDTO(includeChildren?: boolean): FolderServerDTO;
}

// ============ 静态工厂方法接�?============
