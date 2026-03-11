/**
 * useRepository - 仓储模块主 composable
 *
 * 单仓库模型 — 自动初始化用户的唯一仓库，聚焦于资源操作。
 */

import { computed, ref } from 'vue';
import { useRepositoryStore } from '../stores/repositoryStore';
import { REPOSITORY_SERVICE_KEY } from '../../../di/keys';
import { useStrictInject } from '../../../shared/utils/useStrictInject';
import type {
  ResourceBookmarkClientDTO,
  ResourceClientDTO,
  SearchRequest,
  SearchResponse,
} from '@dailyuse/contracts/repository';
import type { Repository } from '@dailyuse/repository/domain-client';
import { searchRepositoryResources } from './repositorySearch';
import type { ResourceInsertionRecentEntry } from '../../editor/composables/useResourceInsertion';

export interface RepositoryUploadFailure {
  fileName: string;
  message: string;
  code: string;
}

export interface RepositoryUploadResult {
  successes: ResourceClientDTO[];
  failures: RepositoryUploadFailure[];
}

export interface RepositoryUploadProgress {
  total: number;
  completed: number;
  currentFileName: string | null;
}

interface RepositoryServiceLike {
  getRepositories(): Promise<{ ok: boolean; data?: Repository[]; error?: { message?: string } }>;
  listResources(
    repositoryId: string,
  ): Promise<{ ok: boolean; data?: ResourceClientDTO[]; error?: { message?: string } }>;
  createResource(
    repositoryId: string,
    request: Record<string, unknown>,
  ): Promise<{ ok: boolean; data?: ResourceClientDTO; error?: { message?: string } }>;
  updateResource(
    resourceId: string,
    request: Record<string, unknown>,
  ): Promise<{ ok: boolean; data?: ResourceClientDTO; error?: { message?: string } }>;
  deleteResource(resourceId: string): Promise<{ ok: boolean; error?: { message?: string } }>;
  search?(
    request: SearchRequest,
  ): Promise<{ ok: boolean; data?: unknown; error?: { message?: string } }>;
  uploadResources?(
    repositoryId: string,
    request: {
      files: File[];
      tags?: string[];
      folderId?: string;
      overwritePolicy?: 'skip' | 'replace';
    },
  ): Promise<{ ok: boolean; data?: unknown; error?: { message?: string } }>;
  listBookmarks?(
    repositoryId: string,
  ): Promise<{ ok: boolean; data?: ResourceBookmarkClientDTO[]; error?: { message?: string } }>;
  updateBookmark?(
    repositoryId: string,
    bookmarkId: string,
    payload: { aliasName: string | null },
  ): Promise<{ ok: boolean; data?: ResourceBookmarkClientDTO; error?: { message?: string } }>;
  reorderBookmarks?(
    repositoryId: string,
    payload: { bookmarkIds: string[] },
  ): Promise<{ ok: boolean; data?: ResourceBookmarkClientDTO[]; error?: { message?: string } }>;
  deleteBookmark?(
    repositoryId: string,
    bookmarkId: string,
  ): Promise<{ ok: boolean; error?: { message?: string } }>;
  getResource?(
    resourceId: string,
  ): Promise<{ ok: boolean; data?: ResourceClientDTO; error?: { message?: string } }>;
}

export function useRepository() {
  const service = useStrictInject(
    REPOSITORY_SERVICE_KEY,
    'RepositoryService',
  ) as RepositoryServiceLike;
  const store = useRepositoryStore();
  const savingId = ref<string | null>(null);
  const isUploading = ref(false);
  const uploadProgress = ref<RepositoryUploadProgress>({
    total: 0,
    completed: 0,
    currentFileName: null,
  });

  const repositoryId = computed(() => store.repositoryId);
  const resources = computed(() => store.resources);
  const resourcesByType = computed(() => store.resourcesByType);
  const currentResource = computed(() => store.currentResource);
  const recentInsertions = computed(() => store.recentInsertions);
  const isLoading = computed(() => store.isLoading);
  const error = computed(() => store.error);
  const isSaving = computed(() => savingId.value !== null);
  const bookmarkPersistenceAvailable = computed(() => typeof service.updateBookmark === 'function');

  function handleError(msg: string): void {
    store.setError(msg);
    console.error(msg);
  }

  // ── Repository init (single-repo) ──
  /**
   * Initialize the user's single repository.
   * Fetches the list and picks the first one (or creates one if none exist).
   */
  async function initRepository() {
    if (store.isInitialized && store.repositoryId) return;

    store.setLoading(true);
    store.setError(null);
    try {
      const result = await service.getRepositories();
      if (result.ok) {
        const repos = (result.data ?? []).map((r: Repository) => r.toDTO());
        if (repos.length > 0) {
          store.setRepositoryId(repos[0].id);
        }
        // If no repos exist, repositoryId stays null — workspace shows empty state
      } else {
        handleError(getResultErrorMessage(result, '加载仓库失败'));
      }
    } finally {
      store.setLoading(false);
      store.setInitialized(true);
    }
  }

  // ── Resources ──
  async function fetchResources(): Promise<void> {
    if (!store.repositoryId) return;
    store.setLoading(true);
    store.setError(null);
    try {
      const result = await service.listResources(store.repositoryId);
      if (result.ok) {
        store.setResources(result.data ?? []);
      } else {
        handleError(getResultErrorMessage(result, '加载资源失败'));
      }
    } finally {
      store.setLoading(false);
    }
  }

  async function createResource(data: {
    name: string;
    type: string;
    mimeType?: string;
    content?: string;
    folderId?: string;
  }): Promise<ResourceClientDTO | null> {
    if (!store.repositoryId) return null;
    savingId.value = 'new';
    store.setError(null);
    try {
      const result = await service.createResource(store.repositoryId, {
        ...data,
      });
      if (result.ok && result.data) {
        store.addResource(result.data);
        return result.data;
      } else {
        handleError(
          result.ok ? '创建资源返回空数据' : getResultErrorMessage(result, '创建资源失败'),
        );
        return null;
      }
    } finally {
      savingId.value = null;
    }
  }

  async function deleteResource(resourceId: string) {
    savingId.value = resourceId;
    store.setError(null);
    try {
      const result = await service.deleteResource(resourceId);
      if (result.ok) {
        store.removeResource(resourceId);
        return true;
      } else {
        handleError(getResultErrorMessage(result, '删除资源失败'));
        return false;
      }
    } finally {
      savingId.value = null;
    }
  }

  async function readResourceAsDataUrl(resource: ResourceClientDTO): Promise<string> {
    const latest = await getResourceById(resource.id);
    const source = latest ?? resource;

    if (typeof source.content !== 'string' || source.content.length === 0) {
      throw new Error('Resource content is unavailable.');
    }

    const mimeType = source.mimeType || guessMimeType(source.name);
    const normalized = source.content.replace(/\s+/g, '');

    if (normalized.startsWith('data:')) {
      return normalized;
    }

    return `data:${mimeType};base64,${normalized}`;
  }

  async function getResourceById(resourceId: string): Promise<ResourceClientDTO | null> {
    if (typeof service.getResource !== 'function') {
      return store.resources.find((resource) => resource.id === resourceId) ?? null;
    }

    const result = await service.getResource(resourceId);
    if (result.ok && result.data) {
      store.updateResource(result.data);
      return result.data;
    }

    return store.resources.find((resource) => resource.id === resourceId) ?? null;
  }

  function recordRecentInsertion(entry: ResourceInsertionRecentEntry): void {
    store.recordRecentInsertion(entry);
  }

  async function saveResourceContent(resourceId: string, content: string) {
    savingId.value = resourceId;
    store.setError(null);
    try {
      const result = await service.updateResource(resourceId, { content });
      if (result.ok && result.data) {
        store.updateResource(result.data);
        return true;
      } else {
        handleError(
          result.ok ? '保存内容返回空数据' : getResultErrorMessage(result, '保存内容失败'),
        );
        return false;
      }
    } finally {
      savingId.value = null;
    }
  }

  async function updateResourceMetadata(resourceId: string, metadata: Record<string, unknown>) {
    savingId.value = resourceId;
    store.setError(null);
    try {
      const result = await service.updateResource(resourceId, { metadata });
      if (result.ok && result.data) {
        store.updateResource(result.data);
        return result.data;
      }

      handleError(
        result.ok ? '更新资源元数据返回空数据' : result.error?.message || '更新资源元数据失败',
      );
      return null;
    } finally {
      savingId.value = null;
    }
  }

  async function createMarkdownNote(
    name?: string,
    initialContent: string = '',
    folderId?: string,
  ): Promise<ResourceClientDTO | null> {
    const noteName = normalizeNoteName(name ?? buildUntitledNoteName());

    return createResource({
      name: noteName,
      type: 'File',
      mimeType: 'text/markdown',
      content: initialContent,
      folderId,
    });
  }

  async function searchResources(request: SearchRequest): Promise<SearchResponse> {
    if (typeof service.search === 'function') {
      const result = await service.search(request);
      if (result.ok && isSearchResponse(result.data)) {
        return result.data;
      }
    }

    return searchRepositoryResources(store.resources, request);
  }

  async function fetchBookmarks(): Promise<void> {
    if (!store.repositoryId || typeof service.listBookmarks !== 'function') {
      return;
    }

    const result = await service.listBookmarks(store.repositoryId);
    if (result.ok) {
      store.setBookmarks(result.data ?? []);
      return;
    }

    handleError(getResultErrorMessage(result, '加载书签失败'));
  }

  async function uploadResources(
    files: File[],
    tags: string[] = [],
    folderId?: string,
  ): Promise<RepositoryUploadResult> {
    if (!store.repositoryId || files.length === 0) {
      return { successes: [], failures: [] };
    }

    isUploading.value = true;
    uploadProgress.value = {
      total: files.length,
      completed: 0,
      currentFileName: files[0]?.name ?? null,
    };

    try {
      if (typeof service.uploadResources === 'function') {
        const remoteResult = await service.uploadResources(store.repositoryId, {
          files,
          tags,
          folderId,
        });
        if (remoteResult.ok && isUploadResponse(remoteResult.data)) {
          const successes = remoteResult.data.successes.map(
            (item: { resource: ResourceClientDTO }) => item.resource,
          );
          const failures = remoteResult.data.failures.map((failure: RepositoryUploadFailure) => ({
            fileName: failure.fileName,
            message: failure.message,
            code: failure.code,
          }));

          uploadProgress.value = {
            total: files.length,
            completed: files.length,
            currentFileName: null,
          };

          for (const resource of successes) {
            store.updateResource(resource);
            if (!store.resources.some((item) => item.id === resource.id)) {
              store.addResource(resource);
            }
          }

          return { successes, failures };
        }
      }

      const successes: ResourceClientDTO[] = [];
      const failures: RepositoryUploadFailure[] = [];

      for (const [index, file] of files.entries()) {
        uploadProgress.value = {
          total: files.length,
          completed: index,
          currentFileName: file.name,
        };

        if (!isTextLikeFile(file)) {
          failures.push({
            fileName: file.name,
            code: 'BINARY_UPLOAD_UNAVAILABLE',
            message: 'Binary upload requires backend support.',
          });
          continue;
        }

        try {
          const content = await file.text();
          const created = await createResource({
            name: file.name,
            type: 'File',
            mimeType: file.type || guessMimeType(file.name),
            content,
            folderId,
          });

          if (!created) {
            failures.push({
              fileName: file.name,
              code: 'CREATE_FAILED',
              message: 'Failed to create repository resource.',
            });
            continue;
          }

          let uploadedResource = created;
          if (tags.length > 0) {
            const updated = await updateResourceMetadata(created.id, {
              ...created.metadata,
              tags,
            });
            if (updated) {
              uploadedResource = updated;
            }
          }

          successes.push(uploadedResource);
        } catch (uploadError) {
          failures.push({
            fileName: file.name,
            code: 'READ_FAILED',
            message:
              uploadError instanceof Error
                ? uploadError.message
                : 'Unable to read the selected file.',
          });
        }
      }

      uploadProgress.value = {
        total: files.length,
        completed: files.length,
        currentFileName: null,
      };

      return { successes, failures };
    } finally {
      isUploading.value = false;
    }
  }

  async function renameBookmark(
    bookmark: ResourceBookmarkClientDTO,
    aliasName: string,
  ): Promise<{ bookmark: ResourceBookmarkClientDTO; persisted: boolean } | null> {
    if (!store.repositoryId) {
      return null;
    }

    const normalizedAlias = aliasName.trim() || null;

    if (typeof service.updateBookmark === 'function') {
      const result = await service.updateBookmark(store.repositoryId, bookmark.id, {
        aliasName: normalizedAlias,
      });
      if (result.ok && result.data) {
        replaceBookmark(result.data);
        return { bookmark: result.data, persisted: true };
      }

      handleError(getResultErrorMessage(result, '重命名书签失败'));
      return null;
    }

    const fallbackBookmark = buildBookmarkWithAlias(bookmark, normalizedAlias, store.resources);
    replaceBookmark(fallbackBookmark);
    return { bookmark: fallbackBookmark, persisted: false };
  }

  async function reorderBookmarks(bookmarkIds: string[]): Promise<boolean> {
    if (!store.repositoryId) {
      return false;
    }

    const previousBookmarks = [...store.bookmarks];
    const orderedBookmarks = bookmarkIds
      .map((bookmarkId) => store.bookmarks.find((bookmark) => bookmark.id === bookmarkId) ?? null)
      .filter((bookmark): bookmark is ResourceBookmarkClientDTO => bookmark !== null);

    store.setBookmarks(orderedBookmarks);

    if (typeof service.reorderBookmarks !== 'function') {
      return false;
    }

    const result = await service.reorderBookmarks(store.repositoryId, { bookmarkIds });
    if (result.ok) {
      if (result.data) {
        store.setBookmarks(result.data);
      }
      return true;
    }

    store.setBookmarks(previousBookmarks);
    handleError(getResultErrorMessage(result, '更新书签顺序失败'));
    return false;
  }

  async function removeBookmark(bookmarkId: string): Promise<boolean> {
    if (!store.repositoryId) {
      store.removeBookmark(bookmarkId);
      return false;
    }

    const previousBookmarks = [...store.bookmarks];
    store.removeBookmark(bookmarkId);

    if (typeof service.deleteBookmark !== 'function') {
      return false;
    }

    const result = await service.deleteBookmark(store.repositoryId, bookmarkId);
    if (result.ok) {
      return true;
    }

    store.setBookmarks(previousBookmarks);
    handleError(getResultErrorMessage(result, '删除书签失败'));
    return false;
  }

  // ── Tabs convenience ──
  function openResource(resource: ResourceClientDTO) {
    store.setCurrentResource(resource);
    store.openTab(resource.id);
  }

  function replaceBookmark(bookmark: ResourceBookmarkClientDTO): void {
    store.setBookmarks(store.bookmarks.map((item) => (item.id === bookmark.id ? bookmark : item)));
  }

  return {
    repositoryId,
    resources,
    resourcesByType,
    currentResource,
    recentInsertions,
    isLoading,
    isSaving,
    isUploading,
    uploadProgress,
    bookmarkPersistenceAvailable,
    error,
    initRepository,
    fetchResources,
    fetchBookmarks,
    createResource,
    createMarkdownNote,
    deleteResource,
    readResourceAsDataUrl,
    getResourceById,
    recordRecentInsertion,
    saveResourceContent,
    updateResourceMetadata,
    uploadResources,
    searchResources,
    renameBookmark,
    reorderBookmarks,
    removeBookmark,
    openResource,
  };
}

function buildUntitledNoteName(): string {
  const now = new Date();
  const parts = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
    String(now.getHours()).padStart(2, '0'),
    String(now.getMinutes()).padStart(2, '0'),
    String(now.getSeconds()).padStart(2, '0'),
  ];

  return `Untitled ${parts.join('-')}.md`;
}

function normalizeNoteName(name: string): string {
  const trimmedName = name.trim() || buildUntitledNoteName();
  return trimmedName.toLowerCase().endsWith('.md') ? trimmedName : `${trimmedName}.md`;
}

function isSearchResponse(value: unknown): value is SearchResponse {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as SearchResponse;
  return Array.isArray(candidate.results) && typeof candidate.totalResults === 'number';
}

function isUploadResponse(value: unknown): value is {
  successes: Array<{ resource: ResourceClientDTO }>;
  failures: RepositoryUploadFailure[];
} {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as {
    successes?: Array<{ resource: ResourceClientDTO }>;
    failures?: RepositoryUploadFailure[];
  };
  return Array.isArray(candidate.successes) && Array.isArray(candidate.failures);
}

function isTextLikeFile(file: File): boolean {
  if (file.type.startsWith('text/')) {
    return true;
  }

  return /\.(md|markdown|txt|json|js|jsx|ts|tsx|css|scss|html|xml|yml|yaml|csv)$/i.test(file.name);
}

function guessMimeType(fileName: string): string {
  if (/\.md$/i.test(fileName)) {
    return 'text/markdown';
  }

  if (/\.(txt|csv|json|ya?ml|xml|html|css|scss|ts|tsx|js|jsx)$/i.test(fileName)) {
    return 'text/plain';
  }

  return 'application/octet-stream';
}

function buildBookmarkWithAlias(
  bookmark: ResourceBookmarkClientDTO,
  aliasName: string | null,
  resources: ResourceClientDTO[],
): ResourceBookmarkClientDTO {
  const resource = resources.find((item) => item.id === bookmark.resourceId) ?? null;
  const displayName = aliasName || resource?.displayName || resource?.name || bookmark.displayName;

  return {
    ...bookmark,
    aliasName,
    displayName,
    updatedAt: Date.now() as ResourceBookmarkClientDTO['updatedAt'],
  };
}

function getResultErrorMessage(
  result: { error?: { message?: string } },
  fallbackMessage: string,
): string {
  return result.error?.message || fallbackMessage;
}

export const __test__ = {
  isUploadResponse,
  buildBookmarkWithAlias,
};
