/**
 * Repository Store - Pinia 状态管理
 * 显式当前仓库上下文，避免在 UI 层隐式依赖仓库列表顺序。
 */

import { defineStore } from 'pinia';
import type {
  RepositoryClientDTO,
  ResourceClientDTO,
  TreeNode,
  ResourceBookmarkClientDTO,
} from '@dailyuse/contracts/repository';

interface BookmarkUiState {
  aliasById: Record<string, string | null>;
  orderedIds: string[] | null;
  removedIds: string[];
}

export interface RepositoryState {
  /** 当前仓库 */
  currentRepository: RepositoryClientDTO | null;
  /** 当前选中的仓库 ID */
  currentRepositoryId: string | null;

  /** 资源列表 */
  resources: ResourceClientDTO[];

  /** 文件树节点 */
  treeNodes: TreeNode[];
  /** 来自服务端的书签真值 */
  persistedBookmarks: ResourceBookmarkClientDTO[];
  /** 仅用于当前会话的书签 UI 回退态 */
  bookmarkUiState: BookmarkUiState;

  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;
}

export const useRepositoryStore = defineStore('repository', {
  state: (): RepositoryState => ({
    currentRepository: null,
    currentRepositoryId: null,
    resources: [],
    treeNodes: [],
    persistedBookmarks: [],
    bookmarkUiState: {
      aliasById: {},
      orderedIds: null,
      removedIds: [],
    },
    isLoading: false,
    error: null,
    isInitialized: false,
  }),

  getters: {
    repositoryId(): string | null {
      return this.currentRepositoryId;
    },

    /** 按类型分组的资源（用于类型化文件树） */
    resourcesByType(): Record<string, ResourceClientDTO[]> {
      const groups: Record<string, ResourceClientDTO[]> = {
        notes: [],
        images: [],
        videos: [],
        audio: [],
        files: [],
        other: [],
      };
      for (const r of Array.isArray(this.resources) ? this.resources : []) {
        const mime = r.mimeType || '';
        const ext = r.extension || '';
        if (mime.startsWith('text/markdown') || ext === '.md') {
          groups.notes.push(r);
        } else if (mime.startsWith('image/')) {
          groups.images.push(r);
        } else if (mime.startsWith('video/')) {
          groups.videos.push(r);
        } else if (mime.startsWith('audio/')) {
          groups.audio.push(r);
        } else if (
          mime === 'application/pdf' ||
          ext === '.pdf' ||
          ext === '.doc' ||
          ext === '.docx' ||
          ext === '.txt'
        ) {
          groups.files.push(r);
        } else {
          groups.other.push(r);
        }
      }
      return groups;
    },

    bookmarks(): ResourceBookmarkClientDTO[] {
      return applyBookmarkUiState(this.persistedBookmarks, this.resources, this.bookmarkUiState);
    },
  },

  actions: {
    // ── Repository ──
    setCurrentRepository(repository: RepositoryClientDTO | null) {
      const nextId = repository?.id ?? null;
      const didChange = this.currentRepositoryId !== nextId;
      this.currentRepository = repository;
      this.currentRepositoryId = nextId;
      if (didChange) {
        this.clearRepositoryScopedState();
      }
    },
    clearRepositoryScopedState() {
      this.resources = [];
      this.treeNodes = [];
      this.persistedBookmarks = [];
      this.resetBookmarkUiState();
    },

    // ── Resources ──
    setResources(items: ResourceClientDTO[]) {
      this.resources = items;
    },
    addResource(r: ResourceClientDTO) {
      this.resources.push(r);
    },
    updateResource(r: ResourceClientDTO) {
      const idx = this.resources.findIndex((x) => x.id === r.id);
      if (idx >= 0) this.resources[idx] = r;
    },
    removeResource(id: string) {
      this.resources = this.resources.filter((r) => r.id !== id);
    },

    // ── Tree Nodes ──
    setTreeNodes(nodes: TreeNode[]) {
      this.treeNodes = nodes;
    },

    // ── Bookmarks ──
    setPersistedBookmarks(items: ResourceBookmarkClientDTO[]) {
      this.persistedBookmarks = items;
    },
    upsertPersistedBookmark(bookmark: ResourceBookmarkClientDTO) {
      const index = this.persistedBookmarks.findIndex((item) => item.id === bookmark.id);
      if (index >= 0) {
        this.persistedBookmarks[index] = bookmark;
        return;
      }

      this.persistedBookmarks.push(bookmark);
    },
    removePersistedBookmark(id: string) {
      this.persistedBookmarks = this.persistedBookmarks.filter((bookmark) => bookmark.id !== id);
    },
    setTransientBookmarkAlias(id: string, aliasName: string | null) {
      this.bookmarkUiState.aliasById = {
        ...this.bookmarkUiState.aliasById,
        [id]: aliasName,
      };
    },
    clearTransientBookmarkAlias(id: string) {
      const nextAliases = { ...this.bookmarkUiState.aliasById };
      delete nextAliases[id];
      this.bookmarkUiState.aliasById = nextAliases;
    },
    setTransientBookmarkOrder(ids: string[] | null) {
      this.bookmarkUiState.orderedIds = ids ? [...ids] : null;
    },
    markTransientBookmarkRemoved(id: string) {
      if (!this.bookmarkUiState.removedIds.includes(id)) {
        this.bookmarkUiState.removedIds = [...this.bookmarkUiState.removedIds, id];
      }
    },
    unmarkTransientBookmarkRemoved(id: string) {
      this.bookmarkUiState.removedIds = this.bookmarkUiState.removedIds.filter(
        (bookmarkId) => bookmarkId !== id,
      );
    },
    resetBookmarkUiState() {
      this.bookmarkUiState = {
        aliasById: {},
        orderedIds: null,
        removedIds: [],
      };
    },
    // ── Common ──
    setLoading(v: boolean) {
      this.isLoading = v;
    },
    setError(e: string | null) {
      this.error = e;
    },
    setInitialized(v: boolean) {
      this.isInitialized = v;
    },

    reset() {
      this.$reset();
    },
  },

  persist: {
    pick: ['currentRepositoryId', 'persistedBookmarks'] as string[],
  },
});

export type RepositoryStoreType = ReturnType<typeof useRepositoryStore>;

function applyBookmarkUiState(
  bookmarks: ResourceBookmarkClientDTO[],
  resources: ResourceClientDTO[],
  uiState: BookmarkUiState,
): ResourceBookmarkClientDTO[] {
  const visibleBookmarks = bookmarks
    .filter((bookmark) => !uiState.removedIds.includes(bookmark.id))
    .map((bookmark) => {
      if (!(bookmark.id in uiState.aliasById)) {
        return bookmark;
      }

      return buildBookmarkWithAlias(bookmark, uiState.aliasById[bookmark.id] ?? null, resources);
    });

  if (!uiState.orderedIds || uiState.orderedIds.length === 0) {
    return visibleBookmarks;
  }

  const byId = new Map(visibleBookmarks.map((bookmark) => [bookmark.id, bookmark]));
  const orderedBookmarks = uiState.orderedIds
    .map((bookmarkId) => byId.get(bookmarkId) ?? null)
    .filter((bookmark): bookmark is ResourceBookmarkClientDTO => bookmark !== null);

  const orderedIds = new Set(orderedBookmarks.map((bookmark) => bookmark.id));
  const remainingBookmarks = visibleBookmarks.filter((bookmark) => !orderedIds.has(bookmark.id));

  return [...orderedBookmarks, ...remainingBookmarks];
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

export const __test__ = {
  applyBookmarkUiState,
  buildBookmarkWithAlias,
};
