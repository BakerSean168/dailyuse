/**
 * Repository Infrastructure Client - Port Interfaces
 *
 * Transport-agnostic interfaces for Repository API operations.
 * Implementations: HTTP adapters (web), IPC adapters (desktop)
 *
 * Types imported from @dailyuse/contracts/repository.
 */

import type { IHttpClient } from '@dailyuse/http-client';
import type {
  RepositoryClientDTO,
  FolderClientDTO,
  ResourceClientDTO,
  FileTreeResponse,
  SearchRequest,
  SearchResponse,
} from '@dailyuse/contracts/repository';

// ============ Transport Client Interfaces ============

// IHttpClient imported from @dailyuse/http-client

export interface IIpcClient {
  invoke<T = unknown>(channel: string, ...args: unknown[]): Promise<T>;
}

// ============ Local Request Types ============
// 合约包暂未定义，临时本地声明

export interface CreateRepositoryRequest {
  name: string;
  type: string;
  description?: string;
}

export interface CreateFolderRequest {
  repositoryUuid: string;
  parentUuid?: string;
  name: string;
}

// ============ Port Interface ============

/**
 * Repository API Client Interface
 */
export interface IRepositoryApiClient {
  // ===== Repository CRUD =====
  createRepository(request: CreateRepositoryRequest): Promise<RepositoryClientDTO>;
  getRepositories(): Promise<RepositoryClientDTO[]>;
  getRepositoryById(uuid: string): Promise<RepositoryClientDTO>;
  deleteRepository(uuid: string): Promise<void>;

  // ===== Folder Operations =====
  createFolder(request: CreateFolderRequest): Promise<FolderClientDTO>;
  getFolderContents(folderUuid: string): Promise<{
    folders: FolderClientDTO[];
    resources: ResourceClientDTO[];
  }>;
  renameFolder(uuid: string, name: string): Promise<FolderClientDTO>;
  moveFolder(uuid: string, targetParentUuid: string): Promise<FolderClientDTO>;
  deleteFolder(uuid: string): Promise<void>;

  // ===== File Tree =====
  getFileTree(repositoryUuid: string): Promise<FileTreeResponse>;

  // ===== Search =====
  search(request: SearchRequest): Promise<SearchResponse>;

  // ===== Resource Operations =====
  getResource(uuid: string): Promise<ResourceClientDTO>;
  renameResource(uuid: string, name: string): Promise<ResourceClientDTO>;
  moveResource(uuid: string, targetFolderUuid: string): Promise<ResourceClientDTO>;
  deleteResource(uuid: string): Promise<void>;
}
