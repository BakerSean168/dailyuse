/**
 * Folder Entity - Server Interface
 * 文件夹实�?- 服务端接�?
 */
import type { FolderId, RepositoryId, DomainDate, TransferDate, PersistenceDate } from '@/primitives';
import type { FolderMetadataServer, FolderMetadataServerDTO } from '../value-objects';

// ============ DTO 定义 ============

/**
 * Folder Server DTO
 */
export interface FolderServerDTO {
  id: string;
  repositoryId: string;
  parentId: string | null;
  name: string;
  path: string;
  order: number;
  isExpanded: boolean;
  metadata: FolderMetadataServerDTO;
  createdAt: TransferDate;
  updatedAt: TransferDate;

  // 子文件夹（可选加载）
  children: FolderServerDTO[] | null;
}

/**
 * Folder Persistence DTO (数据库映�?
 * 扁平化结�?
 */
export interface FolderPersistenceDTO {
  id: string;
  repositoryId: string;
  parentId: string | null;
  name: string;
  path: string;
  order: number;
  isExpanded: boolean;
  metadata: string; // JSON string
  createdAt: PersistenceDate;
  updatedAt: PersistenceDate;

  // 注意：子文件夹（children）通过 parent_id 外键关联
}

// ============ 实体接口 ============

/**
 * Folder 实体 - Server 接口（实例方法）
 */
export interface FolderServer {
  // 基础属�?
  id: FolderId;
  repositoryId: RepositoryId;
  parentId: FolderId | null;
  name: string;
  path: string;
  order: number;
  isExpanded: boolean;
  metadata: FolderMetadataServer;
  createdAt: DomainDate;
  updatedAt: DomainDate;

  // 子文件夹
  children: FolderServer[] | null;
}
