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
import type { ResourceInsertionRecentEntry } from '../../editor/composables/useResourceInsertion';

export type SidebarMode = 'files' | 'search' | 'bookmarks';

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
  /** 当前打开的资源 */
  currentResource: ResourceClientDTO | null;

  /** 文件树节点 */
  treeNodes: TreeNode[];
  /** 来自服务端的书签真值 */
  persistedBookmarks: ResourceBookmarkClientDTO[];
  /** 仅用于当前会话的书签 UI 回退态 */
  bookmarkUiState: BookmarkUiState;
  /** 最近插入的资源 */
  recentInsertions: ResourceInsertionRecentEntry[];

  /** 侧边栏模式 */
  sidebarMode: SidebarMode;
  /** 侧边栏是否折叠 */
  sidebarCollapsed: boolean;

  /** 打开的标签页 IDs */
  openTabIds: string[];
  /** 当前激活的标签页 ID */
  activeTabId: string | null;

  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;
}

export const useRepositoryStore = defineStore('repository', {
  state: (): RepositoryState => ({
    currentRepository: null,
    currentRepositoryId: null,
    resources: [],
    currentResource: null,
    treeNodes: [],
    persistedBookmarks: [],
    bookmarkUiState: {
      aliasById: {},
      orderedIds: null,
      removedIds: [],
    },
    recentInsertions: [],
    sidebarMode: 'files',
    sidebarCollapsed: false,
    openTabIds: [],
    activeTabId: null,
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
        documents: [],
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
          groups.documents.push(r);
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
      this.currentResource = null;
      this.treeNodes = [];
      this.persistedBookmarks = [];
      this.recentInsertions = [];
      this.openTabIds = [];
      this.activeTabId = null;
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
      this.openTabIds = this.openTabIds.filter((tabId) => tabId !== id);
      if (this.activeTabId === id) {
        this.activeTabId = this.openTabIds[0] ?? null;
      }
      if (this.currentResource?.id === id) {
        this.currentResource = null;
      }
    },
    setCurrentResource(r: ResourceClientDTO | null) {
      this.currentResource = r;
      if (r) {
        this.openTab(r.id);
      }
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
    setRecentInsertions(items: ResourceInsertionRecentEntry[]) {
      this.recentInsertions = items;
    },
    recordRecentInsertion(entry: ResourceInsertionRecentEntry) {
      const deduped = this.recentInsertions.filter((item) => item.resourceId !== entry.resourceId);
      this.recentInsertions = [entry, ...deduped].slice(0, 20);
    },

    // ── Sidebar ──
    setSidebarMode(mode: SidebarMode) {
      this.sidebarMode = mode;
    },
    toggleSidebar() {
      this.sidebarCollapsed = !this.sidebarCollapsed;
    },

    // ── Tabs ──
    openTab(resourceId: string) {
      if (!this.openTabIds.includes(resourceId)) {
        this.openTabIds.push(resourceId);
      }
      this.activeTabId = resourceId;
    },
    closeTab(resourceId: string) {
      this.openTabIds = this.openTabIds.filter((id) => id !== resourceId);
      if (this.activeTabId === resourceId) {
        this.activeTabId = this.openTabIds[this.openTabIds.length - 1] ?? null;
      }
    },
    closeOtherTabs(keepId: string) {
      this.openTabIds = [keepId];
      this.activeTabId = keepId;
    },
    closeTabsToRight(fromId: string) {
      const idx = this.openTabIds.indexOf(fromId);
      if (idx >= 0) {
        this.openTabIds = this.openTabIds.slice(0, idx + 1);
        if (!this.openTabIds.includes(this.activeTabId!)) {
          this.activeTabId = fromId;
        }
      }
    },
    closeAllTabs() {
      this.openTabIds = [];
      this.activeTabId = null;
    },
    setActiveTab(id: string) {
      this.activeTabId = id;
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
    pick: [
      'sidebarMode',
      'sidebarCollapsed',
      'currentRepositoryId',
      'openTabIds',
      'activeTabId',
      'persistedBookmarks',
      'recentInsertions',
    ] as string[],
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
