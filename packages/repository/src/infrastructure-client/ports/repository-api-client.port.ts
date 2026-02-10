/**
 * Repository API Client Port Interface
 *
 * Defines the contract for Repository (file/document) API operations.
 * Implementations: RepositoryHttpAdapter (web), RepositoryIpcAdapter (desktop)
 */

import type {
  RepositoryClientDTO,
  FolderClientDTO,
  ResourceClientDTO,
  FileTreeResponse,
  SearchRequest,
  SearchResponse,
} from '@dailyuse/contracts/repository';

/**
 * Create Repository Request
 */
export interface CreateRepositoryRequest {
  name: string;
  type: string;
  description?: string;
}

/**
 * Create Folder Request
 */
export interface CreateFolderRequest {
  repositoryUuid: string;
  parentUuid?: string;
  name: string;
}

/**
 * Repository API Client Interface
 */
export interface IRepositoryApiClient {
  // ===== Repository CRUD =====

  /** 创建仓库 */
  createRepository(request: CreateRepositoryRequest): Promise<RepositoryClientDTO>;

  /** 获取仓库列表 */
  getRepositories(): Promise<RepositoryClientDTO[]>;

  /** 获取仓库详情 */
  getRepositoryById(uuid: string): Promise<RepositoryClientDTO>;

  /** 删除仓库 */
  deleteRepository(uuid: string): Promise<void>;

  // ===== Folder Operations =====

  /** 创建文件夹 */
  createFolder(request: CreateFolderRequest): Promise<FolderClientDTO>;

  /** 获取文件夹内容 */
  getFolderContents(folderUuid: string): Promise<{
    folders: FolderClientDTO[];
    resources: ResourceClientDTO[];
  }>;

  /** 重命名文件夹 */
  renameFolder(uuid: string, name: string): Promise<FolderClientDTO>;

  /** 移动文件夹 */
  moveFolder(uuid: string, targetParentUuid: string): Promise<FolderClientDTO>;

  /** 删除文件夹 */
  deleteFolder(uuid: string): Promise<void>;

  // ===== File Tree =====

  /** 获取文件树 */
  getFileTree(repositoryUuid: string): Promise<FileTreeResponse>;

  // ===== Search =====

  /** 搜索资源 */
  search(request: SearchRequest): Promise<SearchResponse>;

  // ===== Resource Operations =====

  /** 获取资源详情 */
  getResource(uuid: string): Promise<ResourceClientDTO>;

  /** 重命名资源 */
  renameResource(uuid: string, name: string): Promise<ResourceClientDTO>;

  /** 移动资源 */
  moveResource(uuid: string, targetFolderUuid: string): Promise<ResourceClientDTO>;

  /** 删除资源 */
  deleteResource(uuid: string): Promise<void>;
}
