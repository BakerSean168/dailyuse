/**
 * Folder Entity - Server Interface
 * 文件夹实体 - 服务端接口
 */
import type { FolderMetadataServer, FolderMetadataServerDTO } from '../value-objects';

// ============ DTO 定义 ============

/**
 * Folder Server DTO
 */
export interface FolderServerDTO {
  uuid: string;
  repositoryUuid: string;
  parentUuid?: string | null;
  name: string;
  path: string;
  order: number;
  isExpanded: boolean;
  metadata: FolderMetadataServerDTO;
  createdAt: number; // epoch ms
  updatedAt: number; // epoch ms

  // 子文件夹（可选加载）
  children?: FolderServerDTO[] | null;
}

/**
 * Folder Persistence DTO (数据库映射)
 * 扁平化结构
 */
export interface FolderPersistenceDTO {
  uuid: string;
  repositoryUuid: string;
  parentUuid?: string | null;
  name: string;
  path: string;
  order: number;
  isExpanded: boolean;
  metadata: string; // JSON string
  createdAt: Date;
  updatedAt: Date;

  // 注意：子文件夹（children）通过 parent_uuid 外键关联
}

// ============ 实体接口 ============

/**
 * Folder 实体 - Server 接口（实例方法）
 */
export interface FolderServer {
  // 基础属性
  uuid: string;
  repositoryUuid: string;
  parentUuid?: string | null;
  name: string;
  path: string;
  order: number;
  isExpanded: boolean;
  metadata: FolderMetadataServer;
  createdAt: number;
  updatedAt: number;

  // 子文件夹
  children?: FolderServer[] | null;

  // 方法
  rename(newName: string): void;
  moveTo(newParentUuid: string | null, newParentPath?: string): void;
  updatePath(newPath: string): void;
  updateMetadata(metadata: Partial<FolderMetadataServer>): void;
  setExpanded(isExpanded: boolean): void;

  // DTO 转换方法
  toServerDTO(includeChildren?: boolean): FolderServerDTO;
  toPersistenceDTO(): FolderPersistenceDTO;
}

// ============ 静态工厂方法接口 ============

export interface FolderServerStatic {
  create(params: {
    repositoryUuid: string;
    parentUuid?: string;
    name: string;
    parentPath?: string;
    order?: number;
  }): FolderServer;

  fromServerDTO(dto: FolderServerDTO): FolderServer;
  fromPersistenceDTO(dto: FolderPersistenceDTO): FolderServer;
}
