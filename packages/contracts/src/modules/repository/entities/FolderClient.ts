/**
 * Folder Entity - Client Interface
 * 文件夹实体 - 客户端接口
 */
import type { FolderServerDTO } from './FolderServer';
import type { FolderMetadataClient, FolderMetadataClientDTO } from '../value-objects';

// ============ DTO 定义 ============

/**
 * Folder Client DTO
 */
export interface FolderClientDTO {
  uuid: string;
  repositoryUuid: string;
  parentUuid?: string | null;
  name: string;
  path: string;
  order: number;
  isExpanded: boolean;
  metadata: FolderMetadataClientDTO;
  createdAt: number;
  updatedAt: number;

  // 子文件夹
  children?: FolderClientDTO[] | null;

  // UI 计算字段
  depth: number; // 文件夹层级深度
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
  // 基础属性
  uuid: string;
  repositoryUuid: string;
  parentUuid?: string | null;
  name: string;
  path: string;
  order: number;
  isExpanded: boolean;
  metadata: FolderMetadataClient;
  createdAt: Date;
  updatedAt: Date;

  // 子文件夹
  children?: FolderClient[] | null;

  // UI 计算属性
  depth: number;
  isRoot: boolean;
  hasChildren: boolean;
  pathParts: string[];
  displayName: string;
  createdAtText: string;
  updatedAtText: string;

  // 方法
  rename(newName: string): void;
  moveTo(newParentUuid: string | null, newParentPath?: string): void;
  updateMetadata(metadata: Partial<FolderMetadataClient>): void;
  setExpanded(isExpanded: boolean): void;

  // DTO 转换方法
  toClientDTO(includeChildren?: boolean): FolderClientDTO;
  toServerDTO(includeChildren?: boolean): FolderServerDTO;
}

// ============ 静态工厂方法接口 ============

export interface FolderClientStatic {
  fromServerDTO(dto: FolderServerDTO): FolderClient;
  fromClientDTO(dto: FolderClientDTO): FolderClient;
}
