/**
 * Repository IPC Adapter
 *
 * IPC implementation of IRepositoryApiClient for Electron desktop app.
 * Uses tryCatch for consistent Result<T> error handling.
 */

import type { Result } from '@dailyuse/contracts/result';
import type {
  IResultIpcClient,
  IRepositoryApiClient,
  CreateRepositoryRequest,
  CreateFolderRequest,
  CreateResourceRequest,
  UpdateResourceRequest,
} from '../types';
import type {
  RepositoryClientDTO,
  FolderClientDTO,
  ResourceClientDTO,
  FileTreeResponse,
  SearchRequest,
  SearchResponse,
} from '@dailyuse/contracts/repository';

/**
 * Repository IPC Adapter
 *
 * Implements IRepositoryApiClient using Electron IPC.
 */
export class RepositoryIpcAdapter implements IRepositoryApiClient {
  private readonly channel = 'repository';

  constructor(private readonly ipcClient: IResultIpcClient) {}

  // ===== Repository CRUD =====

  async createRepository(request: CreateRepositoryRequest): Promise<Result<RepositoryClientDTO>> {
    return this.ipcClient.invoke(`${this.channel}:create`, request);
  }

  async getRepositories(): Promise<Result<RepositoryClientDTO[]>> {
    return this.ipcClient.invoke(`${this.channel}:list`);
  }

  async getRepositoryById(id: string): Promise<Result<RepositoryClientDTO>> {
    return this.ipcClient.invoke(`${this.channel}:get`, id);
  }

  async deleteRepository(id: string): Promise<Result<void>> {
    return this.ipcClient.invoke(`${this.channel}:delete`, id);
  }

  // ===== Folder Operations =====

  async createFolder(request: CreateFolderRequest): Promise<Result<FolderClientDTO>> {
    return this.ipcClient.invoke(`${this.channel}:folder:create`, request);
  }

  async getFolderContents(folderId: string): Promise<
    Result<{
      folders: FolderClientDTO[];
      resources: ResourceClientDTO[];
    }>
  > {
    return this.ipcClient.invoke(`${this.channel}:folder:list`, folderId);
  }

  async renameFolder(id: string, name: string): Promise<Result<FolderClientDTO>> {
    return this.ipcClient.invoke(`${this.channel}:folder:update`, { id, name });
  }

  async moveFolder(id: string, targetParentId: string): Promise<Result<FolderClientDTO>> {
    return this.ipcClient.invoke(`${this.channel}:folder:update`, { id, targetParentId });
  }

  async deleteFolder(id: string): Promise<Result<void>> {
    return this.ipcClient.invoke(`${this.channel}:folder:delete`, id);
  }

  // ===== File Tree =====

  async getFileTree(repositoryId: string): Promise<Result<FileTreeResponse>> {
    return this.ipcClient.invoke(`${this.channel}:folder:list`, repositoryId);
  }

  // ===== Search =====

  async search(request: SearchRequest): Promise<Result<SearchResponse>> {
    return this.ipcClient.invoke(`${this.channel}:search`, request);
  }

  // ===== Resource Operations =====

  async listResources(repositoryId: string): Promise<Result<ResourceClientDTO[]>> {
    return this.ipcClient.invoke(`${this.channel}:resource:list`, repositoryId);
  }

  async createResource(
    repositoryId: string,
    request: CreateResourceRequest,
  ): Promise<Result<ResourceClientDTO>> {
    return this.ipcClient.invoke(`${this.channel}:resource:create`, { repositoryId, ...request });
  }

  async getResource(id: string): Promise<Result<ResourceClientDTO>> {
    return this.ipcClient.invoke(`${this.channel}:resource:get`, id);
  }

  async updateResource(
    id: string,
    request: UpdateResourceRequest,
  ): Promise<Result<ResourceClientDTO>> {
    return this.ipcClient.invoke(`${this.channel}:resource:update`, { id, ...request });
  }

  async renameResource(id: string, name: string): Promise<Result<ResourceClientDTO>> {
    return this.ipcClient.invoke(`${this.channel}:resource:update`, { id, name });
  }

  async moveResource(id: string, targetFolderId: string): Promise<Result<ResourceClientDTO>> {
    return this.ipcClient.invoke(`${this.channel}:resource:update`, { id, targetFolderId });
  }

  async deleteResource(id: string): Promise<Result<void>> {
    return this.ipcClient.invoke(`${this.channel}:resource:delete`, id);
  }
}

export function createRepositoryIpcAdapter(ipcClient: IResultIpcClient): RepositoryIpcAdapter {
  return new RepositoryIpcAdapter(ipcClient);
}
