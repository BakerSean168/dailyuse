/**
 * useRepository - Repository module page facade
 *
 * Thin orchestrator that composes sub-composables and delegates
 * search, upload, bookmark, tree, and resource CRUD concerns
 * to dedicated modules.
 */

import { computed, inject } from 'vue';
import { useRepositoryStore } from '../stores/repository-store';
import { REPOSITORY_SERVICE_KEY, DESKTOP_AUTH_API_KEY } from '../../../di/keys';
import { useStrictInject } from '../../../shared/utils/useStrictInject';
import type {
  FileTreeResponse,
  ResourceBookmarkClientDTO,
  ResourceClientDTO,
  SearchRequest,
} from '@dailyuse/contracts/repository';
import type { Repository } from '@dailyuse/repository/client';
import type { Result } from '@dailyuse/contracts/result';
import { getI18nGlobal } from '../../../plugins/i18n';
import { executeDesktopAuthenticatedResult } from '../../../shared/utils/execute-desktop-authenticated-result';
import { useRepositoryBookmarks } from './useRepositoryBookmarks';
import { useRepositorySearch } from './useRepositorySearch';
import { useRepositoryUpload } from './useRepositoryUpload';
import { useRepositoryResources } from './useRepositoryResources';
import { useRepositoryTree } from './useRepositoryTree';

// Re-export upload types for backward compatibility
export type { RepositoryUploadFailure, RepositoryUploadResult, RepositoryUploadProgress } from './useRepositoryUpload';

interface RepositoryServiceLike {
  getCurrentRepository(): Promise<Result<Repository | null>>;
  listResources(repositoryId: string): Promise<Result<ResourceClientDTO[]>>;
  createResource(
    repositoryId: string,
    request: Record<string, unknown>,
  ): Promise<Result<ResourceClientDTO>>;
  updateResource(
    resourceId: string,
    request: Record<string, unknown>,
  ): Promise<Result<ResourceClientDTO>>;
  deleteResource(resourceId: string): Promise<Result<void>>;
  renameResource?(resourceId: string, name: string): Promise<Result<ResourceClientDTO>>;
  getFileTree?(repositoryId: string): Promise<Result<FileTreeResponse>>;
  search?(request: SearchRequest): Promise<Result<unknown>>;
  uploadResources?(
    repositoryId: string,
    request: {
      files: File[];
      tags?: string[];
      folderId?: string;
      overwritePolicy?: 'skip' | 'replace';
    },
  ): Promise<Result<unknown>>;
  listBookmarks?(repositoryId: string): Promise<Result<ResourceBookmarkClientDTO[]>>;
  updateBookmark?(
    repositoryId: string,
    bookmarkId: ResourceBookmarkClientDTO['id'],
    payload: { aliasName: string | null },
  ): Promise<Result<ResourceBookmarkClientDTO>>;
  reorderBookmarks?(
    repositoryId: string,
    payload: { bookmarkIds: Array<ResourceBookmarkClientDTO['id']> },
  ): Promise<Result<ResourceBookmarkClientDTO[]>>;
  deleteBookmark?(
    repositoryId: string,
    bookmarkId: ResourceBookmarkClientDTO['id'],
  ): Promise<Result<void>>;
  getResource?(resourceId: string): Promise<Result<ResourceClientDTO>>;
}


export function useRepository() {
  const service = useStrictInject(
    REPOSITORY_SERVICE_KEY,
    'RepositoryService',
  ) as unknown as RepositoryServiceLike;
  const desktopApi = inject(DESKTOP_AUTH_API_KEY, undefined);
  const store = useRepositoryStore();

  const currentRepositoryId = computed(() => store.currentRepositoryId);
  const currentRepository = computed(() => store.currentRepository);
  const repositoryId = computed(() => store.repositoryId);
  const resources = computed(() => store.resources);
  const resourcesByType = computed(() => store.resourcesByType);
  const isLoading = computed(() => store.isLoading);
  const error = computed(() => store.error);

  function handleError(msg: string): void {
    store.setError(msg);
    console.error(msg);
  }

  async function executeRepositoryOperation<T>(
    operation: () => Promise<Result<T>>,
    fallbackMessage: string,
  ) {
    const translate = getI18nGlobal()?.t;
    return executeDesktopAuthenticatedResult({
      operation,
      logScope: 'Repository',
      t: translate,
      fallbackKey: 'common.operationFailed',
      desktopApi,
      onError: (error, translatedMessage) => {
        handleError(
          translatedMessage === translate?.('common.operationFailed')
            ? fallbackMessage
            : translatedMessage,
        );
      },
    });
  }

  // ── Sub-composables ──

  const treeComposable = useRepositoryTree(service, executeRepositoryOperation);
  const { fetchTreeNodes } = treeComposable;

  const resourceComposable = useRepositoryResources({
    service,
    executeOperation: executeRepositoryOperation,
    handleError,
    getRepositoryId: () => store.currentRepositoryId,
    getResources: () => store.resources,
    addResource: (r) => store.addResource(r),
    updateResourceInStore: (r) => store.updateResource(r),
    removeResource: (id) => store.removeResource(id),
    refreshTree: fetchTreeNodes,
  });

  const searchComposable = useRepositorySearch({
    service,
    executeOperation: executeRepositoryOperation,
    getResources: () => store.resources,
  });

  const uploadComposable = useRepositoryUpload({
    service,
    executeOperation: executeRepositoryOperation,
    getRepositoryId: () => store.currentRepositoryId,
    createResource: resourceComposable.createResource,
    updateResourceMetadata: resourceComposable.updateResourceMetadata,
    onResourcesUploaded: (uploadedResources) => {
      for (const resource of uploadedResources) {
        store.updateResource(resource);
        if (!store.resources.some((item) => item.id === resource.id)) {
          store.addResource(resource);
        }
      }
    },
  });

  const bookmarkComposable = useRepositoryBookmarks();

  // ── Repository init ──

  async function initRepository() {
    if (store.isInitialized) return;
    store.setLoading(true);
    store.setError(null);
    try {
      const result = await executeRepositoryOperation(
        () => service.getCurrentRepository(),
        '加载仓库失败',
      );
      if (result.ok) {
        const repository = result.data ?? null;
        store.setCurrentRepository(repository ? repository.toDTO() : null);
        await fetchTreeNodes();
      } else {
        store.setCurrentRepository(null);
      }
    } finally {
      store.setLoading(false);
      store.setInitialized(true);
    }
  }

  async function fetchResources(): Promise<void> {
    if (!store.currentRepositoryId) return;
    store.setLoading(true);
    store.setError(null);
    try {
      await resourceComposable.fetchResources();
    } finally {
      store.setLoading(false);
    }
  }

  return {
    currentRepositoryId,
    currentRepository,
    repositoryId,
    resources,
    resourcesByType,
    isLoading,
    isSaving: resourceComposable.isSaving,
    isUploading: uploadComposable.isUploading,
    uploadProgress: uploadComposable.uploadProgress,
    error,
    initRepository,
    fetchResources,
    createResource: resourceComposable.createResource,
    createMarkdownNote: resourceComposable.createMarkdownNote,
    deleteResource: resourceComposable.deleteResource,
    readResourceAsDataUrl: resourceComposable.readResourceAsDataUrl,
    getResourceById: resourceComposable.getResourceById,
    updateResourceMetadata: resourceComposable.updateResourceMetadata,
    uploadResources: uploadComposable.uploadResources,
    searchResources: searchComposable.searchResources,
    renameResource: resourceComposable.renameResource,
    // Tree (delegated)
    ...treeComposable,
    // Bookmarks (delegated)
    ...bookmarkComposable,
  };
}
