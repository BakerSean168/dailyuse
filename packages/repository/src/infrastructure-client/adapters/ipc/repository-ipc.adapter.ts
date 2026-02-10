/**
 * Repository IPC Adapter
 *
 * IPC implementation of IRepositoryApiClient for Electron desktop app.
 */

import type {
  IRepositoryApiClient,
  CreateRepositoryRequest,
  CreateFolderRequest,
} from '../../ports/repository-api-client.port';
import type { IpcClient } from '../../../shared/ipc-client.types';
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

  constructor(private readonly ipcClient: IpcClient) {}

  // ===== Repository CRUD =====

  async createRepository(request: CreateRepositoryRequest): Promise<RepositoryClientDTO> {
    return this.ipcClient.invoke(`${this.channel}:create`, request);
  }

  async getRepositories(): Promise<RepositoryClientDTO[]> {
    return this.ipcClient.invoke(`${this.channel}:list`);
  }

  async getRepositoryById(uuid: string): Promise<RepositoryClientDTO> {
    return this.ipcClient.invoke(`${this.channel}:get`, uuid);
  }

  async deleteRepository(uuid: string): Promise<void> {
    return this.ipcClient.invoke(`${this.channel}:delete`, uuid);
  }

  // ===== Folder Operations =====

  async createFolder(request: CreateFolderRequest): Promise<FolderClientDTO> {
    return this.ipcClient.invoke(`${this.channel}:folder:create`, request);
  }

  async getFolderContents(folderUuid: string): Promise<{
    folders: FolderClientDTO[];
    resources: ResourceClientDTO[];
  }> {
    return this.ipcClient.invoke(`${this.channel}:folder:contents`, folderUuid);
  }

  async renameFolder(uuid: string, name: string): Promise<FolderClientDTO> {
    return this.ipcClient.invoke(`${this.channel}:folder:rename`, { uuid, name });
  }

  async moveFolder(uuid: string, targetParentUuid: string): Promise<FolderClientDTO> {
    return this.ipcClient.invoke(`${this.channel}:folder:move`, { uuid, targetParentUuid });
  }

  async deleteFolder(uuid: string): Promise<void> {
    return this.ipcClient.invoke(`${this.channel}:folder:delete`, uuid);
  }

  // ===== File Tree =====

  async getFileTree(repositoryUuid: string): Promise<FileTreeResponse> {
    return this.ipcClient.invoke(`${this.channel}:tree`, repositoryUuid);
  }

  // ===== Search =====

  async search(request: SearchRequest): Promise<SearchResponse> {
    return this.ipcClient.invoke(`${this.channel}:search`, request);
  }

  // ===== Resource Operations =====

  async getResource(uuid: string): Promise<ResourceClientDTO> {
    return this.ipcClient.invoke(`${this.channel}:resource:get`, uuid);
  }

  async renameResource(uuid: string, name: string): Promise<ResourceClientDTO> {
    return this.ipcClient.invoke(`${this.channel}:resource:rename`, { uuid, name });
  }

  async moveResource(uuid: string, targetFolderUuid: string): Promise<ResourceClientDTO> {
    return this.ipcClient.invoke(`${this.channel}:resource:move`, { uuid, targetFolderUuid });
  }

  async deleteResource(uuid: string): Promise<void> {
    return this.ipcClient.invoke(`${this.channel}:resource:delete`, uuid);
  }
}
