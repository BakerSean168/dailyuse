/**
 * Repository IPC Adapter
 *
 * IPC implementation of IRepositoryApiClient for Electron desktop app.
 * Uses tryCatch for consistent Result<T> error handling.
 */

import type { Result } from '@dailyuse/contracts/result';
import { tryCatch } from '@dailyuse/contracts/result';
import type {
  IIpcClient,
  IRepositoryApiClient,
  CreateRepositoryRequest,
  CreateFolderRequest,
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

  constructor(private readonly ipcClient: IIpcClient) {}

  // ===== Repository CRUD =====

  async createRepository(request: CreateRepositoryRequest): Promise<Result<RepositoryClientDTO>> {
    return tryCatch(() => this.ipcClient.invoke(`${this.channel}:create`, request));
  }

  async getRepositories(): Promise<Result<RepositoryClientDTO[]>> {
    return tryCatch(() => this.ipcClient.invoke(`${this.channel}:list`));
  }

  async getRepositoryById(uuid: string): Promise<Result<RepositoryClientDTO>> {
    return tryCatch(() => this.ipcClient.invoke(`${this.channel}:get`, uuid));
  }

  async deleteRepository(uuid: string): Promise<Result<void>> {
    return tryCatch(() => this.ipcClient.invoke(`${this.channel}:delete`, uuid));
  }

  // ===== Folder Operations =====

  async createFolder(request: CreateFolderRequest): Promise<Result<FolderClientDTO>> {
    return tryCatch(() => this.ipcClient.invoke(`${this.channel}:folder:create`, request));
  }

  async getFolderContents(folderUuid: string): Promise<Result<{
    folders: FolderClientDTO[];
    resources: ResourceClientDTO[];
  }>> {
    return tryCatch(() => this.ipcClient.invoke(`${this.channel}:folder:contents`, folderUuid));
  }

  async renameFolder(uuid: string, name: string): Promise<Result<FolderClientDTO>> {
    return tryCatch(() => this.ipcClient.invoke(`${this.channel}:folder:rename`, { uuid, name }));
  }

  async moveFolder(uuid: string, targetParentUuid: string): Promise<Result<FolderClientDTO>> {
    return tryCatch(() => this.ipcClient.invoke(`${this.channel}:folder:move`, { uuid, targetParentUuid }));
  }

  async deleteFolder(uuid: string): Promise<Result<void>> {
    return tryCatch(() => this.ipcClient.invoke(`${this.channel}:folder:delete`, uuid));
  }

  // ===== File Tree =====

  async getFileTree(repositoryUuid: string): Promise<Result<FileTreeResponse>> {
    return tryCatch(() => this.ipcClient.invoke(`${this.channel}:tree`, repositoryUuid));
  }

  // ===== Search =====

  async search(request: SearchRequest): Promise<Result<SearchResponse>> {
    return tryCatch(() => this.ipcClient.invoke(`${this.channel}:search`, request));
  }

  // ===== Resource Operations =====

  async getResource(uuid: string): Promise<Result<ResourceClientDTO>> {
    return tryCatch(() => this.ipcClient.invoke(`${this.channel}:resource:get`, uuid));
  }

  async renameResource(uuid: string, name: string): Promise<Result<ResourceClientDTO>> {
    return tryCatch(() => this.ipcClient.invoke(`${this.channel}:resource:rename`, { uuid, name }));
  }

  async moveResource(uuid: string, targetFolderUuid: string): Promise<Result<ResourceClientDTO>> {
    return tryCatch(() => this.ipcClient.invoke(`${this.channel}:resource:move`, { uuid, targetFolderUuid }));
  }

  async deleteResource(uuid: string): Promise<Result<void>> {
    return tryCatch(() => this.ipcClient.invoke(`${this.channel}:resource:delete`, uuid));
  }
}

/**
 * Factory function to create RepositoryIpcAdapter
 */
export function createRepositoryIpcAdapter(ipcClient: IIpcClient): RepositoryIpcAdapter {
  return new RepositoryIpcAdapter(ipcClient);
}
