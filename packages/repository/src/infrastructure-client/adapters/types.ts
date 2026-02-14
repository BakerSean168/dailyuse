/**
 * Repository Infrastructure Client - Port Interfaces
 *
 * Transport-agnostic interfaces for Repository API operations.
 * Implementations: HTTP adapters (web), IPC adapters (desktop)
 *
 * All methods return Result<T> for consistent error handling.
 * Types imported from @dailyuse/contracts/repository.
 */

import type { Result } from '@dailyuse/contracts/result';
import type { IResultHttpClient } from '@dailyuse/http-client';
import type {
  RepositoryClientDTO,
  FolderClientDTO,
  ResourceClientDTO,
  FileTreeResponse,
  SearchRequest,
  SearchResponse,
} from '@dailyuse/contracts/repository';

// ============ Transport Client Interfaces ============
// Module only defines what it needs — concrete implementations injected from App layer.

// IResultHttpClient imported from @dailyuse/http-client

/**
 * IPC Client interface.
 * Satisfied by IpcClientImpl / ResultIpcClient at the App level.
 */
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
  createRepository(request: CreateRepositoryRequest): Promise<Result<RepositoryClientDTO>>;
  getRepositories(): Promise<Result<RepositoryClientDTO[]>>;
  getRepositoryById(uuid: string): Promise<Result<RepositoryClientDTO>>;
  deleteRepository(uuid: string): Promise<Result<void>>;

  // ===== Folder Operations =====
  createFolder(request: CreateFolderRequest): Promise<Result<FolderClientDTO>>;
  getFolderContents(folderUuid: string): Promise<Result<{
    folders: FolderClientDTO[];
    resources: ResourceClientDTO[];
  }>>;
  renameFolder(uuid: string, name: string): Promise<Result<FolderClientDTO>>;
  moveFolder(uuid: string, targetParentUuid: string): Promise<Result<FolderClientDTO>>;
  deleteFolder(uuid: string): Promise<Result<void>>;

  // ===== File Tree =====
  getFileTree(repositoryUuid: string): Promise<Result<FileTreeResponse>>;

  // ===== Search =====
  search(request: SearchRequest): Promise<Result<SearchResponse>>;

  // ===== Resource Operations =====
  getResource(uuid: string): Promise<Result<ResourceClientDTO>>;
  renameResource(uuid: string, name: string): Promise<Result<ResourceClientDTO>>;
  moveResource(uuid: string, targetFolderUuid: string): Promise<Result<ResourceClientDTO>>;
  deleteResource(uuid: string): Promise<Result<void>>;
}
