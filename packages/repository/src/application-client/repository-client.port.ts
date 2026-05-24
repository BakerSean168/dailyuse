import type { Result } from '@dailyuse/contracts/result';
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
import type {
  CreateFolderRequest,
  CreateResourceRequest,
  UpdateResourceRequest,
  UploadResourcesRequest,
} from './ports/repository-api-client.port';
import type { Repository } from '../domain-client/aggregates/repository';

export interface RepositoryClientPort {
  getCurrentRepository(): Promise<Result<Repository | null>>;

  // Folder Operations
  createFolder(request: CreateFolderRequest): Promise<Result<FolderClientDTO>>;
  getFolderContents(folderId: string): Promise<Result<{ folders: FolderClientDTO[]; resources: ResourceClientDTO[] }>>;
  renameFolder(id: string, name: string): Promise<Result<FolderClientDTO>>;
  moveFolder(id: string, targetParentId: string): Promise<Result<FolderClientDTO>>;
  deleteFolder(id: string): Promise<Result<void>>;

  // File Tree
  getFileTree(repositoryId: string): Promise<Result<FileTreeResponse>>;

  // Search
  search(request: SearchRequest): Promise<Result<SearchResponse>>;

  // Resource Operations
  listResources(repositoryId: string): Promise<Result<ResourceClientDTO[]>>;
  createResource(repositoryId: string, request: CreateResourceRequest): Promise<Result<ResourceClientDTO>>;
  getResource(id: string): Promise<Result<ResourceClientDTO>>;
  updateResource(id: string, request: UpdateResourceRequest): Promise<Result<ResourceClientDTO>>;
  renameResource(id: string, name: string): Promise<Result<ResourceClientDTO>>;
  moveResource(id: string, targetFolderId: string): Promise<Result<ResourceClientDTO>>;
  deleteResource(id: string): Promise<Result<void>>;
  uploadResources(repositoryId: string, request: UploadResourcesRequest): Promise<Result<UploadResourcesResponseDTO>>;

  // Bookmarks
  listBookmarks(repositoryId: string): Promise<Result<ResourceBookmarkClientDTO[]>>;
  createBookmark(repositoryId: string, request: CreateResourceBookmarkRequestDTO): Promise<Result<ResourceBookmarkClientDTO>>;
  updateBookmark(repositoryId: string, bookmarkId: string, request: UpdateResourceBookmarkRequestDTO): Promise<Result<ResourceBookmarkClientDTO>>;
  reorderBookmarks(repositoryId: string, request: ReorderResourceBookmarksRequestDTO): Promise<Result<ResourceBookmarkClientDTO[]>>;
  deleteBookmark(repositoryId: string, bookmarkId: string): Promise<Result<void>>;
}
