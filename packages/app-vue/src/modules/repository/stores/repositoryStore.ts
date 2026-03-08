/**
 * Repository Store - Pinia 状态管理
 * 单仓库模型 — 每个用户只有一个仓库，状态聚焦于资源管理。
 */

import { defineStore } from 'pinia';
import type {
  ResourceClientDTO,
  TreeNode,
  ResourceBookmarkClientDTO,
} from '@dailyuse/contracts/repository';

export type SidebarMode = 'files' | 'search' | 'bookmarks';

export interface RepositoryState {
  /** 当前仓库 ID（单仓库，初始化后不变） */
  repositoryId: string | null;

  /** 资源列表 */
  resources: ResourceClientDTO[];
  /** 当前打开的资源 */
  currentResource: ResourceClientDTO | null;

  /** 文件树节点 */
  treeNodes: TreeNode[];
  /** 书签列表 */
  bookmarks: ResourceBookmarkClientDTO[];

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
    repositoryId: null,
    resources: [],
    currentResource: null,
    treeNodes: [],
    bookmarks: [],
    sidebarMode: 'files',
    sidebarCollapsed: false,
    openTabIds: [],
    activeTabId: null,
    isLoading: false,
    error: null,
    isInitialized: false,
  }),

  getters: {
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
  },

  actions: {
    // ── Repository ──
    setRepositoryId(id: string) {
      this.repositoryId = id;
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
    setBookmarks(items: ResourceBookmarkClientDTO[]) {
      this.bookmarks = items;
    },
    addBookmark(b: ResourceBookmarkClientDTO) {
      this.bookmarks.push(b);
    },
    removeBookmark(id: string) {
      this.bookmarks = this.bookmarks.filter((b) => b.id !== id);
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
    pick: ['sidebarMode', 'sidebarCollapsed', 'openTabIds', 'activeTabId'] as string[],
  },
});

export type RepositoryStoreType = ReturnType<typeof useRepositoryStore>;
