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
  CreateFolderRequest,
  CreateResourceRequest,
  UpdateResourceRequest,
  UploadResourcesRequest,
} from '../types';
import type {
  RepositoryClientDTO,
  FolderClientDTO,
  ResourceClientDTO,
  FileTreeResponse,
  SearchRequest,
  SearchResponse,
  UploadResourcesResponseDTO,
  ResourceBookmarkClientDTO,
  CreateResourceBookmarkRequestDTO,
  UpdateResourceBookmarkRequestDTO,
  ReorderResourceBookmarksRequestDTO,
} from '@dailyuse/contracts/repository';

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  if (typeof btoa === 'function') {
    return btoa(binary);
  }
  return Buffer.from(bytes).toString('base64');
}

/**
 * Repository IPC Adapter
 *
 * Implements IRepositoryApiClient using Electron IPC.
 */
export class RepositoryIpcAdapter implements IRepositoryApiClient {
  private readonly channel = 'repository';

  constructor(private readonly ipcClient: IResultIpcClient) {}

  async getCurrentRepository(): Promise<Result<RepositoryClientDTO | null>> {
    return this.ipcClient.invoke(`${this.channel}:current`);
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
    return this.ipcClient.invoke(`${this.channel}:folder:list`, { folderId });
  }

  async renameFolder(id: string, name: string): Promise<Result<FolderClientDTO>> {
    return this.ipcClient.invoke(`${this.channel}:folder:update`, { id, name });
  }

  async moveFolder(id: string, targetParentId: string): Promise<Result<FolderClientDTO>> {
    return this.ipcClient.invoke(`${this.channel}:folder:update`, { id, parentId: targetParentId });
  }

  async deleteFolder(id: string): Promise<Result<void>> {
    return this.ipcClient.invoke(`${this.channel}:folder:delete`, id);
  }

  // ===== File Tree =====

  async getFileTree(repositoryId: string): Promise<Result<FileTreeResponse>> {
    return this.ipcClient.invoke(`${this.channel}:folder:list`, { repositoryId });
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

  async uploadResources(
    repositoryId: string,
    request: UploadResourcesRequest,
  ): Promise<Result<UploadResourcesResponseDTO>> {
    const files = await Promise.all(
      request.files.map(async (file) => {
        if (typeof File !== 'undefined' && file instanceof File) {
          const buffer = new Uint8Array(await file.arrayBuffer());
          return {
            name: file.name,
            mimeType: file.type,
            size: file.size,
            contentBase64: bytesToBase64(buffer),
          };
        }
        return file;
      }),
    );

    return this.ipcClient.invoke(`${this.channel}:resource:upload`, {
      repositoryId,
      files,
      metadata: {
        folderId: request.folderId,
        tags: request.tags,
        overwritePolicy: request.overwritePolicy,
      },
    });
  }

  async listBookmarks(repositoryId: string): Promise<Result<ResourceBookmarkClientDTO[]>> {
    return this.ipcClient.invoke(`${this.channel}:bookmark:list`, { repositoryId });
  }

  async createBookmark(
    repositoryId: string,
    request: CreateResourceBookmarkRequestDTO,
  ): Promise<Result<ResourceBookmarkClientDTO>> {
    return this.ipcClient.invoke(`${this.channel}:bookmark:create`, { repositoryId, request });
  }

  async updateBookmark(
    repositoryId: string,
    bookmarkId: string,
    request: UpdateResourceBookmarkRequestDTO,
  ): Promise<Result<ResourceBookmarkClientDTO>> {
    return this.ipcClient.invoke(`${this.channel}:bookmark:update`, {
      repositoryId,
      bookmarkId,
      request,
    });
  }

  async reorderBookmarks(
    repositoryId: string,
    request: ReorderResourceBookmarksRequestDTO,
  ): Promise<Result<ResourceBookmarkClientDTO[]>> {
    return this.ipcClient.invoke(`${this.channel}:bookmark:reorder`, { repositoryId, request });
  }

  async deleteBookmark(repositoryId: string, bookmarkId: string): Promise<Result<void>> {
    return this.ipcClient.invoke(`${this.channel}:bookmark:delete`, { repositoryId, bookmarkId });
  }
}

export function createRepositoryIpcAdapter(ipcClient: IResultIpcClient): RepositoryIpcAdapter {
  return new RepositoryIpcAdapter(ipcClient);
}
