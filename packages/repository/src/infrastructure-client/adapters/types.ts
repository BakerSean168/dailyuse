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
  UploadResourcesRequestDTO,
  UploadResourcesResponseDTO,
  UploadResourceFileDTO,
  ResourceBookmarkClientDTO,
  CreateResourceBookmarkRequestDTO,
  UpdateResourceBookmarkRequestDTO,
  ReorderResourceBookmarksRequestDTO,
} from '@dailyuse/contracts/repository';

// ============ Transport Client Interfaces ============
// Module only defines what it needs — concrete implementations injected from App layer.

// IResultHttpClient imported from @dailyuse/http-client

/**
 * IPC Client interface (Result-returning).
 * Satisfied by ResultIpcClient from @dailyuse/ipc-client at the App level.
 */
export interface IResultIpcClient {
  invoke<T = unknown>(channel: string, ...args: unknown[]): Promise<Result<T>>;
}

// ============ Local Request Types ============
// 合约包暂未定义，临时本地声明

export interface CreateRepositoryRequest {
  name: string;
  type: string;
  description?: string;
}

export interface CreateFolderRequest {
  repositoryId: string;
  parentId?: string;
  name: string;
}

export interface CreateResourceRequest {
  name: string;
  type: string;
  mimeType?: string;
  content?: string;
  folderId?: string;
}

export interface UpdateResourceRequest {
  name?: string;
  content?: string;
  metadata?: Record<string, unknown>;
}

export interface UploadFileLike {
  name: string;
  type?: string;
  size?: number;
  arrayBuffer(): Promise<ArrayBuffer>;
}

export interface UploadResourcesRequest extends UploadResourcesRequestDTO {
  files: Array<UploadFileLike | UploadResourceFileDTO>;
}

// ============ Port Interface ============

/**
 * Repository API Client Interface
 */
export interface IRepositoryApiClient {
  // ===== Repository CRUD =====
  createRepository(request: CreateRepositoryRequest): Promise<Result<RepositoryClientDTO>>;
  getRepositories(): Promise<Result<RepositoryClientDTO[]>>;
  getRepositoryById(id: string): Promise<Result<RepositoryClientDTO>>;
  deleteRepository(id: string): Promise<Result<void>>;

  // ===== Folder Operations =====
  createFolder(request: CreateFolderRequest): Promise<Result<FolderClientDTO>>;
  getFolderContents(folderId: string): Promise<
    Result<{
      folders: FolderClientDTO[];
      resources: ResourceClientDTO[];
    }>
  >;
  renameFolder(id: string, name: string): Promise<Result<FolderClientDTO>>;
  moveFolder(id: string, targetParentId: string): Promise<Result<FolderClientDTO>>;
  deleteFolder(id: string): Promise<Result<void>>;

  // ===== File Tree =====
  getFileTree(repositoryId: string): Promise<Result<FileTreeResponse>>;

  // ===== Search =====
  search(request: SearchRequest): Promise<Result<SearchResponse>>;

  // ===== Resource Operations =====
  listResources(repositoryId: string): Promise<Result<ResourceClientDTO[]>>;
  createResource(
    repositoryId: string,
    request: CreateResourceRequest,
  ): Promise<Result<ResourceClientDTO>>;
  getResource(id: string): Promise<Result<ResourceClientDTO>>;
  updateResource(id: string, request: UpdateResourceRequest): Promise<Result<ResourceClientDTO>>;
  renameResource(id: string, name: string): Promise<Result<ResourceClientDTO>>;
  moveResource(id: string, targetFolderId: string): Promise<Result<ResourceClientDTO>>;
  deleteResource(id: string): Promise<Result<void>>;
  uploadResources(
    repositoryId: string,
    request: UploadResourcesRequest,
  ): Promise<Result<UploadResourcesResponseDTO>>;

  listBookmarks(repositoryId: string): Promise<Result<ResourceBookmarkClientDTO[]>>;
  createBookmark(
    repositoryId: string,
    request: CreateResourceBookmarkRequestDTO,
  ): Promise<Result<ResourceBookmarkClientDTO>>;
  updateBookmark(
    repositoryId: string,
    bookmarkId: string,
    request: UpdateResourceBookmarkRequestDTO,
  ): Promise<Result<ResourceBookmarkClientDTO>>;
  reorderBookmarks(
    repositoryId: string,
    request: ReorderResourceBookmarksRequestDTO,
  ): Promise<Result<ResourceBookmarkClientDTO[]>>;
  deleteBookmark(repositoryId: string, bookmarkId: string): Promise<Result<void>>;
}
