/**
 * useRepository - 仓储模块主 composable
 *
 * 显式维护当前仓库上下文，并区分服务端书签真值与临时 UI 回退态。
 */

import { computed, ref } from 'vue';
import { useRepositoryStore } from '../stores/repositoryStore';
import { REPOSITORY_SERVICE_KEY } from '../../../di/keys';
import { useStrictInject } from '../../../shared/utils/useStrictInject';
import { AuthChannels } from '@dailyuse/contracts/electron';
import type {
  FileTreeResponse,
  ResourceBookmarkClientDTO,
  ResourceClientDTO,
  SearchRequest,
  SearchResponse,
  TreeNode,
} from '@dailyuse/contracts/repository';
import type { Repository } from '@dailyuse/repository/domain-client';
import { searchRepositoryResources } from './repositorySearch';

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

type DesktopAuthApi = {
  invoke?: (channel: string, ...args: unknown[]) => Promise<unknown>;
};

interface RepositoryServiceLike {
  getCurrentRepository(): Promise<{
    ok: boolean;
    data?: Repository | null;
    error?: { code?: string; message?: string };
  }>;
  listResources(repositoryId: string): Promise<{
    ok: boolean;
    data?: ResourceClientDTO[];
    error?: { code?: string; message?: string };
  }>;
  createResource(
    repositoryId: string,
    request: Record<string, unknown>,
  ): Promise<{
    ok: boolean;
    data?: ResourceClientDTO;
    error?: { code?: string; message?: string };
  }>;
  updateResource(
    resourceId: string,
    request: Record<string, unknown>,
  ): Promise<{
    ok: boolean;
    data?: ResourceClientDTO;
    error?: { code?: string; message?: string };
  }>;
  deleteResource(
    resourceId: string,
  ): Promise<{ ok: boolean; error?: { code?: string; message?: string } }>;
  renameResource?(
    resourceId: string,
    name: string,
  ): Promise<{
    ok: boolean;
    data?: ResourceClientDTO;
    error?: { code?: string; message?: string };
  }>;
  getFileTree?(repositoryId: string): Promise<{
    ok: boolean;
    data?: FileTreeResponse;
    error?: { code?: string; message?: string };
  }>;
  search?(
    request: SearchRequest,
  ): Promise<{ ok: boolean; data?: unknown; error?: { code?: string; message?: string } }>;
  uploadResources?(
    repositoryId: string,
    request: {
      files: File[];
      tags?: string[];
      folderId?: string;
      overwritePolicy?: 'skip' | 'replace';
    },
  ): Promise<{ ok: boolean; data?: unknown; error?: { code?: string; message?: string } }>;
  listBookmarks?(repositoryId: string): Promise<{
    ok: boolean;
    data?: ResourceBookmarkClientDTO[];
    error?: { code?: string; message?: string };
  }>;
  updateBookmark?(
    repositoryId: string,
    bookmarkId: string,
    payload: { aliasName: string | null },
  ): Promise<{
    ok: boolean;
    data?: ResourceBookmarkClientDTO;
    error?: { code?: string; message?: string };
  }>;
  reorderBookmarks?(
    repositoryId: string,
    payload: { bookmarkIds: string[] },
  ): Promise<{
    ok: boolean;
    data?: ResourceBookmarkClientDTO[];
    error?: { code?: string; message?: string };
  }>;
  deleteBookmark?(
    repositoryId: string,
    bookmarkId: string,
  ): Promise<{ ok: boolean; error?: { code?: string; message?: string } }>;
  getResource?(resourceId: string): Promise<{
    ok: boolean;
    data?: ResourceClientDTO;
    error?: { code?: string; message?: string };
  }>;
}

type ResultLike<T = unknown> = {
  ok: boolean;
  data?: T;
  error?: { code?: string; message?: string };
};

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

  const currentRepositoryId = computed(() => store.currentRepositoryId);
  const currentRepository = computed(() => store.currentRepository);
  const repositoryId = computed(() => store.repositoryId);
  const resources = computed(() => store.resources);
  const treeNodes = computed(() => store.treeNodes);
  const resourcesByType = computed(() => store.resourcesByType);
  const bookmarks = computed(() => store.bookmarks);
  const isLoading = computed(() => store.isLoading);
  const error = computed(() => store.error);
  const isSaving = computed(() => savingId.value !== null);
  const bookmarkCapabilities = computed(() => ({
    canList: typeof service.listBookmarks === 'function',
    canRename: typeof service.updateBookmark === 'function',
    canReorder: typeof service.reorderBookmarks === 'function',
    canRemove: typeof service.deleteBookmark === 'function',
  }));
  const bookmarkPersistenceAvailable = computed(() => bookmarkCapabilities.value.canRename);

  function handleError(msg: string): void {
    store.setError(msg);
    console.error(msg);
  }

  async function ensureDesktopAuthReady(): Promise<boolean> {
    return ensureDesktopAuthReadyWithApi((window as { electronAPI?: DesktopAuthApi }).electronAPI);
  }

  async function maybeRecoverAuth(error: { code?: string }): Promise<boolean> {
    return shouldRecoverAuth(error)
      ? ensureDesktopAuthReadyWithApi((window as { electronAPI?: DesktopAuthApi }).electronAPI)
      : false;
  }

  async function executeWithAuthRecovery<T extends ResultLike>(
    operation: () => Promise<T>,
  ): Promise<T> {
    let result = await operation();

    if (!result.ok && result.error && (await maybeRecoverAuth(result.error))) {
      result = await operation();
    }

    return result;
  }

  // ── Repository init ──
  /** Initialize repository context from the explicit single-repository boundary. */
  async function initRepository() {
    if (store.isInitialized) return;

    store.setLoading(true);
    store.setError(null);
    try {
      const result = await executeWithAuthRecovery(() => service.getCurrentRepository());
      if (result.ok) {
        const repository = result.data ?? null;
        store.setCurrentRepository(repository ? repository.toDTO() : null);
        await fetchTreeNodes();
      } else {
        store.setCurrentRepository(null);
        handleError(getResultErrorMessage(result, '加载仓库失败'));
      }
    } finally {
      store.setLoading(false);
      store.setInitialized(true);
    }
  }

  // ── Resources ──
  async function fetchResources(): Promise<void> {
    if (!store.currentRepositoryId) return;
    const repositoryId = store.currentRepositoryId;
    store.setLoading(true);
    store.setError(null);
    try {
      const result = await executeWithAuthRecovery(() => service.listResources(repositoryId));
      if (result.ok) {
        store.setResources(result.data ?? []);
        await fetchTreeNodes();
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
    if (!store.currentRepositoryId) return null;
    const repositoryId = store.currentRepositoryId;
    savingId.value = 'new';
    store.setError(null);
    console.info('[Repository] createResource:start', {
      repositoryId,
      name: data.name,
      type: data.type,
      folderId: data.folderId ?? null,
    });
    try {
      const result = await executeWithAuthRecovery(() =>
        service.createResource(repositoryId, {
          ...data,
        }),
      );
      if (result.ok && result.data) {
        store.addResource(result.data);
        await fetchTreeNodes();
        console.info('[Repository] createResource:done', {
          repositoryId,
          resourceId: result.data.id,
          resourceName: result.data.displayName || result.data.name,
        });
        return result.data;
      } else {
        console.warn('[Repository] createResource:failed', {
          repositoryId,
          ok: result.ok,
          errorCode: result.error?.code ?? null,
          errorMessage: result.error?.message ?? null,
        });
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
      const result = await executeWithAuthRecovery(() => service.deleteResource(resourceId));
      if (result.ok) {
        store.removeResource(resourceId);
        await fetchTreeNodes();
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
    console.info('[Repository] getResourceById:start', {
      resourceId,
      repositoryId: store.currentRepositoryId,
    });

    if (typeof service.getResource !== 'function') {
      const cached = store.resources.find((resource) => resource.id === resourceId) ?? null;
      console.info('[Repository] getResourceById:cache-only', {
        resourceId,
        hit: Boolean(cached),
      });
      return cached;
    }

    try {
      const result = await executeWithAuthRecovery(() => service.getResource!(resourceId));
      if (result.ok && result.data) {
        store.updateResource(result.data);
        console.info('[Repository] getResourceById:done', {
          resourceId,
          hit: true,
          source: 'service',
        });
        return result.data;
      }

      const cached = store.resources.find((resource) => resource.id === resourceId) ?? null;
      console.info('[Repository] getResourceById:fallback-cache', {
        resourceId,
        hit: Boolean(cached),
        errorCode: result.error?.code ?? null,
      });
      return cached;
    } catch (cause) {
      const cached = store.resources.find((resource) => resource.id === resourceId) ?? null;
      console.warn('[Repository] getResourceById:exception-fallback', {
        resourceId,
        hit: Boolean(cached),
        cause: cause instanceof Error ? cause.message : String(cause),
      });
      return cached;
    }
  }

  async function updateResourceMetadata(resourceId: string, metadata: Record<string, unknown>) {
    savingId.value = resourceId;
    store.setError(null);
    try {
      const result = await executeWithAuthRecovery(() =>
        service.updateResource(resourceId, { metadata }),
      );
      if (result.ok && result.data) {
        store.updateResource(result.data);
        await fetchTreeNodes();
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
    const requestedName = normalizeNoteName(name ?? buildUntitledNoteName());
    const noteName = ensureUniqueNoteName(
      requestedName,
      store.resources.filter((resource) => resource.folderId === (folderId ?? null)),
    );

    console.info('[Repository] createMarkdownNote', {
      repositoryId: store.currentRepositoryId,
      requestedName,
      noteName,
      folderId: folderId ?? null,
    });

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
      const result = await executeWithAuthRecovery(() => service.search!(request));
      if (result.ok && isSearchResponse(result.data)) {
        return result.data;
      }
    }

    return searchRepositoryResources(store.resources, request);
  }

  async function fetchBookmarks(): Promise<void> {
    if (!store.currentRepositoryId || !bookmarkCapabilities.value.canList) {
      return;
    }

    const repositoryId = store.currentRepositoryId;

    const listBookmarks = service.listBookmarks;
    if (!listBookmarks) {
      return;
    }

    const result = await executeWithAuthRecovery(() => listBookmarks(repositoryId));
    if (result.ok) {
      store.setPersistedBookmarks(result.data ?? []);
      store.resetBookmarkUiState();
      return;
    }

    handleError(getResultErrorMessage(result, '加载书签失败'));
  }

  async function resyncBookmarks(): Promise<void> {
    if (!store.currentRepositoryId || !bookmarkCapabilities.value.canList) {
      store.resetBookmarkUiState();
      return;
    }

    await fetchBookmarks();
  }

  async function uploadResources(
    files: File[],
    tags: string[] = [],
    folderId?: string,
  ): Promise<RepositoryUploadResult> {
    if (!store.currentRepositoryId || files.length === 0) {
      return { successes: [], failures: [] };
    }

    const repositoryId = store.currentRepositoryId;

    isUploading.value = true;
    uploadProgress.value = {
      total: files.length,
      completed: 0,
      currentFileName: files[0]?.name ?? null,
    };

    try {
      if (typeof service.uploadResources === 'function') {
        const remoteResult = await executeWithAuthRecovery(() =>
          service.uploadResources!(repositoryId, {
            files,
            tags,
            folderId,
          }),
        );
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
    if (!store.currentRepositoryId) {
      return null;
    }

    const repositoryId = store.currentRepositoryId;

    const normalizedAlias = aliasName.trim() || null;

    if (bookmarkCapabilities.value.canRename) {
      const updateBookmark = service.updateBookmark;
      if (!updateBookmark) {
        return null;
      }

      const result = await executeWithAuthRecovery(() =>
        updateBookmark(repositoryId, bookmark.id, {
          aliasName: normalizedAlias,
        }),
      );
      if (result.ok && result.data) {
        store.upsertPersistedBookmark(result.data);
        store.clearTransientBookmarkAlias(bookmark.id);
        return { bookmark: result.data, persisted: true };
      }

      handleError(getResultErrorMessage(result, '重命名书签失败'));
      await resyncBookmarks();
      return null;
    }

    store.setTransientBookmarkAlias(bookmark.id, normalizedAlias);
    const fallbackBookmark = store.bookmarks.find((item) => item.id === bookmark.id) ?? bookmark;
    return { bookmark: fallbackBookmark, persisted: false };
  }

  async function reorderBookmarks(bookmarkIds: string[]): Promise<boolean> {
    if (!store.currentRepositoryId) {
      return false;
    }

    const repositoryId = store.currentRepositoryId;

    if (!bookmarkCapabilities.value.canReorder) {
      return false;
    }

    const previousOrder = store.bookmarkUiState.orderedIds;
    store.setTransientBookmarkOrder(bookmarkIds);

    const reorderBookmarks = service.reorderBookmarks;
    if (!reorderBookmarks) {
      store.setTransientBookmarkOrder(previousOrder);
      return false;
    }

    const result = await executeWithAuthRecovery(() =>
      reorderBookmarks(repositoryId, { bookmarkIds }),
    );
    if (result.ok) {
      if (result.data) {
        store.setPersistedBookmarks(result.data);
      } else {
        store.setPersistedBookmarks(
          reorderBookmarkCollection(store.persistedBookmarks, bookmarkIds),
        );
      }
      store.resetBookmarkUiState();
      return true;
    }

    store.setTransientBookmarkOrder(previousOrder);
    handleError(getResultErrorMessage(result, '更新书签顺序失败'));
    await resyncBookmarks();
    return false;
  }

  async function removeBookmark(bookmarkId: string): Promise<boolean> {
    if (!store.currentRepositoryId) {
      return false;
    }

    const repositoryId = store.currentRepositoryId;

    if (!bookmarkCapabilities.value.canRemove) {
      return false;
    }

    store.markTransientBookmarkRemoved(bookmarkId);

    const deleteBookmark = service.deleteBookmark;
    if (!deleteBookmark) {
      store.unmarkTransientBookmarkRemoved(bookmarkId);
      return false;
    }

    const result = await executeWithAuthRecovery(() => deleteBookmark(repositoryId, bookmarkId));
    if (result.ok) {
      store.removePersistedBookmark(bookmarkId);
      store.unmarkTransientBookmarkRemoved(bookmarkId);
      return true;
    }

    store.unmarkTransientBookmarkRemoved(bookmarkId);
    handleError(getResultErrorMessage(result, '删除书签失败'));
    await resyncBookmarks();
    return false;
  }

  // ── Tabs convenience ──
  async function fetchTreeNodes(): Promise<TreeNode[]> {
    if (!store.currentRepositoryId || typeof service.getFileTree !== 'function') {
      store.setTreeNodes([]);
      return [];
    }

    const repositoryId = store.currentRepositoryId;
    const result = await executeWithAuthRecovery(() => service.getFileTree!(repositoryId));
    if (result.ok) {
      const tree = result.data?.tree ?? [];
      store.setTreeNodes(tree);
      return tree;
    }

    handleError(getResultErrorMessage(result, '加载目录失败'));
    return store.treeNodes;
  }

  async function renameResource(
    resourceId: string,
    name: string,
  ): Promise<ResourceClientDTO | null> {
    if (typeof service.renameResource !== 'function') {
      handleError('当前环境不支持重命名资源');
      return null;
    }

    const trimmedName = name.trim();
    if (!trimmedName) {
      handleError('资源名称不能为空');
      return null;
    }

    const result = await executeWithAuthRecovery(() =>
      service.renameResource!(resourceId, trimmedName),
    );
    if (result.ok && result.data) {
      store.updateResource(result.data);
      await fetchTreeNodes();
      return result.data;
    }

    handleError(
      result.ok ? '重命名资源返回空数据' : getResultErrorMessage(result, '重命名资源失败'),
    );
    return null;
  }

  return {
    currentRepositoryId,
    currentRepository,
    repositoryId,
    resources,
    treeNodes,
    resourcesByType,
    bookmarks,
    isLoading,
    isSaving,
    isUploading,
    uploadProgress,
    bookmarkCapabilities,
    bookmarkPersistenceAvailable,
    error,
    initRepository,
    fetchResources,
    fetchBookmarks,
    resyncBookmarks,
    createResource,
    createMarkdownNote,
    deleteResource,
    readResourceAsDataUrl,
    getResourceById,
    updateResourceMetadata,
    uploadResources,
    searchResources,
    fetchTreeNodes,
    renameResource,
    renameBookmark,
    reorderBookmarks,
    removeBookmark,
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

function ensureUniqueNoteName(name: string, resources: ResourceClientDTO[]): string {
  const normalizedExistingNames = new Set(resources.map((resource) => resource.name.toLowerCase()));
  if (!normalizedExistingNames.has(name.toLowerCase())) {
    return name;
  }

  const extensionIndex = name.toLowerCase().lastIndexOf('.md');
  const baseName = extensionIndex >= 0 ? name.slice(0, extensionIndex) : name;

  let suffix = 2;
  while (normalizedExistingNames.has(`${baseName} ${suffix}.md`.toLowerCase())) {
    suffix += 1;
  }

  return `${baseName} ${suffix}.md`;
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

function getResultErrorMessage(
  result: { error?: { message?: string } },
  fallbackMessage: string,
): string {
  return result.error?.message || fallbackMessage;
}

function reorderBookmarkCollection(
  bookmarks: ResourceBookmarkClientDTO[],
  bookmarkIds: string[],
): ResourceBookmarkClientDTO[] {
  const bookmarkById = new Map(bookmarks.map((bookmark) => [bookmark.id, bookmark]));
  const ordered = bookmarkIds
    .map((bookmarkId) => bookmarkById.get(bookmarkId) ?? null)
    .filter((bookmark): bookmark is ResourceBookmarkClientDTO => bookmark !== null);
  const includedIds = new Set(ordered.map((bookmark) => bookmark.id));

  return [...ordered, ...bookmarks.filter((bookmark) => !includedIds.has(bookmark.id))];
}

export const __test__ = {
  isUploadResponse,
  reorderBookmarkCollection,
  ensureUniqueNoteName,
  executeAuthRecovery: async (
    operation: () => Promise<ResultLike>,
    host?: { electronAPI?: DesktopAuthApi },
  ) => {
    const result = await operation();
    if (!result.ok && result.error && shouldRecoverAuth(result.error)) {
      return ensureDesktopAuthReadyWithApi(host?.electronAPI);
    }
    return false;
  },
};

function shouldRecoverAuth(error: { code?: string }): boolean {
  return error.code === 'AUTH_REQUIRED' || error.code === 'AUTH_RESTORING';
}

async function ensureDesktopAuthReadyWithApi(api?: DesktopAuthApi): Promise<boolean> {
  if (!api?.invoke) {
    return false;
  }

  try {
    const status = (await api.invoke(AuthChannels.GET_STATUS)) as {
      authenticated?: boolean;
      runtimeState?: string;
    };

    if (status?.authenticated) {
      return true;
    }

    if (status?.runtimeState === 'RESTORING' || status?.runtimeState === 'UNINITIALIZED') {
      await api.invoke(AuthChannels.INITIALIZE);
      const refreshed = (await api.invoke(AuthChannels.GET_STATUS)) as {
        authenticated?: boolean;
      };
      return Boolean(refreshed?.authenticated);
    }
  } catch (error) {
    console.warn('[Repository] Failed to ensure desktop auth readiness', error);
  }

  return false;
}
