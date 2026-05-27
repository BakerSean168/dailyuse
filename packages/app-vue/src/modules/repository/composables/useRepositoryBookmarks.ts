/**
 * useRepositoryBookmarks - 书签 CRUD 与 UI 状态管理
 *
 * 从 useRepository 中提取，独立管理书签的持久化、临时 UI 回退态和排序。
 */

import { computed, inject } from 'vue';
import type { ResourceBookmarkClientDTO } from '@dailyuse/contracts/repository';
import type { Result } from '@dailyuse/contracts/result';
import { useRepositoryStore } from '../stores/repository-store';
import { REPOSITORY_SERVICE_KEY, DESKTOP_AUTH_API_KEY } from '../../../di/keys';
import { useStrictInject } from '../../../shared/utils/useStrictInject';
import { getI18nGlobal } from '../../../plugins/i18n';
import { translateResultError } from '../../../shared/utils/translate-result-error';
import { executeDesktopAuthenticatedResult } from '../../../shared/utils/execute-desktop-authenticated-result';

interface BookmarkCapableService {
  listBookmarks?(repositoryId: string): Promise<Result<ResourceBookmarkClientDTO[]>>;
  updateBookmark?(
    repositoryId: string,
    bookmarkId: string,
    payload: { aliasName: string | null },
  ): Promise<Result<ResourceBookmarkClientDTO>>;
  reorderBookmarks?(
    repositoryId: string,
    payload: { bookmarkIds: string[] },
  ): Promise<Result<ResourceBookmarkClientDTO[]>>;
  deleteBookmark?(repositoryId: string, bookmarkId: string): Promise<Result<void>>;
}

export function useRepositoryBookmarks() {
  const service = useStrictInject(
    REPOSITORY_SERVICE_KEY,
    'RepositoryService',
  ) as BookmarkCapableService;
  const desktopApi = inject(DESKTOP_AUTH_API_KEY, undefined);
  const store = useRepositoryStore();

  const bookmarks = computed(() => store.bookmarks);
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

  function getResultErrorMessage(
    result: Result<unknown>,
    fallbackMessage: string,
  ): string {
    const t = getI18nGlobal()?.t;
    if (!t) return !result.ok ? result.error?.message || fallbackMessage : fallbackMessage;
    const translated = translateResultError(!result.ok ? result.error : null, t, {
      fallbackKey: 'common.operationFailed',
    });
    return translated === t('common.operationFailed') ? fallbackMessage : translated;
  }

  async function executeRepositoryOperation<T>(
    operation: () => Promise<Result<T>>,
    fallbackMessage: string,
  ): Promise<Result<T>> {
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

  async function fetchBookmarks(): Promise<void> {
    if (!store.currentRepositoryId || !bookmarkCapabilities.value.canList) return;

    const repositoryId = store.currentRepositoryId;
    const listBookmarks = service.listBookmarks;
    if (!listBookmarks) return;

    const result = await executeRepositoryOperation(
      () => listBookmarks(repositoryId),
      '加载书签失败',
    );
    if (result.ok) {
      store.setPersistedBookmarks(result.data ?? []);
      store.resetBookmarkUiState();
    }
  }

  async function resyncBookmarks(): Promise<void> {
    if (!store.currentRepositoryId || !bookmarkCapabilities.value.canList) {
      store.resetBookmarkUiState();
      return;
    }
    await fetchBookmarks();
  }

  async function renameBookmark(
    bookmark: ResourceBookmarkClientDTO,
    aliasName: string,
  ): Promise<{ bookmark: ResourceBookmarkClientDTO; persisted: boolean } | null> {
    if (!store.currentRepositoryId) return null;

    const repositoryId = store.currentRepositoryId;
    const normalizedAlias = aliasName.trim() || null;

    if (bookmarkCapabilities.value.canRename) {
      const updateBookmark = service.updateBookmark;
      if (!updateBookmark) return null;

      const result = await executeRepositoryOperation(
        () => updateBookmark(repositoryId, bookmark.id, { aliasName: normalizedAlias }),
        '重命名书签失败',
      );
      if (result.ok && result.data) {
        store.upsertPersistedBookmark(result.data);
        store.clearTransientBookmarkAlias(bookmark.id);
        return { bookmark: result.data, persisted: true };
      }

      if (!result.ok) {
        handleError(getResultErrorMessage(result, '重命名书签失败'));
      } else {
        handleError('重命名书签失败');
      }
      await resyncBookmarks();
      return null;
    }

    store.setTransientBookmarkAlias(bookmark.id, normalizedAlias);
    const fallbackBookmark = store.bookmarks.find((item) => item.id === bookmark.id) ?? bookmark;
    return { bookmark: fallbackBookmark, persisted: false };
  }

  async function reorderBookmarks(
    bookmarkIds: Array<ResourceBookmarkClientDTO['id']>,
  ): Promise<boolean> {
    if (!store.currentRepositoryId) return false;

    const repositoryId = store.currentRepositoryId;
    if (!bookmarkCapabilities.value.canReorder) return false;

    const previousOrder = store.bookmarkUiState.orderedIds;
    store.setTransientBookmarkOrder(bookmarkIds);

    const reorderFn = service.reorderBookmarks;
    if (!reorderFn) {
      store.setTransientBookmarkOrder(previousOrder);
      return false;
    }

    const result = await executeRepositoryOperation(
      () => reorderFn(repositoryId, { bookmarkIds }),
      '更新书签顺序失败',
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
    await resyncBookmarks();
    return false;
  }

  async function removeBookmark(bookmarkId: ResourceBookmarkClientDTO['id']): Promise<boolean> {
    if (!store.currentRepositoryId) return false;

    const repositoryId = store.currentRepositoryId;
    if (!bookmarkCapabilities.value.canRemove) return false;

    store.markTransientBookmarkRemoved(bookmarkId);

    const deleteBookmark = service.deleteBookmark;
    if (!deleteBookmark) {
      store.unmarkTransientBookmarkRemoved(bookmarkId);
      return false;
    }

    const result = await executeRepositoryOperation(
      () => deleteBookmark(repositoryId, bookmarkId),
      '删除书签失败',
    );
    if (result.ok) {
      store.removePersistedBookmark(bookmarkId);
      store.unmarkTransientBookmarkRemoved(bookmarkId);
      return true;
    }

    store.unmarkTransientBookmarkRemoved(bookmarkId);
    await resyncBookmarks();
    return false;
  }

  return {
    bookmarks,
    bookmarkCapabilities,
    bookmarkPersistenceAvailable,
    fetchBookmarks,
    resyncBookmarks,
    renameBookmark,
    reorderBookmarks,
    removeBookmark,
  };
}

function reorderBookmarkCollection(
  bookmarks: ResourceBookmarkClientDTO[],
  bookmarkIds: Array<ResourceBookmarkClientDTO['id']>,
): ResourceBookmarkClientDTO[] {
  const bookmarkById = new Map(bookmarks.map((b) => [b.id, b]));
  const ordered = bookmarkIds
    .map((id) => bookmarkById.get(id) ?? null)
    .filter((b): b is ResourceBookmarkClientDTO => b !== null);
  const includedIds = new Set(ordered.map((b) => b.id));
  return [...ordered, ...bookmarks.filter((b) => !includedIds.has(b.id))];
}

export const __test__ = { reorderBookmarkCollection };
