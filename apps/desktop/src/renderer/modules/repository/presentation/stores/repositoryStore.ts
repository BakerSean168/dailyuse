/**
 * Repository Store - Zustand 状态管理
 *
 * 管理 Repository 模块的所有状态，包括：
 * - 仓库列表缓存
 * - 资源列表缓存
 * - 文件夹列表缓存
 * - UI 状态（选中、搜索等）
 *
 * @module repository/presentation/stores
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  RepositoryType,
  RepositoryStatus,
  SearchResultItem,
} from '@dailyuse/contracts/repository';
import { Repository, Folder, Resource } from '@dailyuse/repository/domain-client';
import { repositoryApplicationService } from '@dailyuse/repository/application-client';

// ============ State Interface ============
export interface RepositoryState {
  // 核心数据
  repositories: Repository[];
  repositoriesById: Record<string, Repository>;
  resources: Resource[];
  resourcesById: Record<string, Resource>;
  folders: Folder[];
  foldersById: Record<string, Folder>;

  // 加载状态
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;

  // UI 状态
  selectedRepositoryId: string | null;
  selectedResourceId: string | null;
  selectedFolderId: string | null;
  expandedFolderIds: Set<string>;

  // 搜索状态
  searchQuery: string;
  searchResults: SearchResultItem[];
  isSearching: boolean;

  // 分页信息
  pagination: {
    page: number;
    limit: number;
    total: number;
  };

  // 缓存管理
  lastSyncTime: Date | null;
}

// ============ Filter Options ============
export interface RepositoryFilters {
  type?: RepositoryType;
  status?: RepositoryStatus;
  searchQuery?: string;
}

export interface ResourceFilters {
  repositoryId?: string;
  folderId?: string | null;
  searchQuery?: string;
}

// ============ Actions Interface ============
export interface RepositoryActions {
  // Repository CRUD
  setRepositories: (repositories: Repository[]) => void;
  addRepository: (repository: Repository) => void;
  updateRepository: (id: string, updates: Partial<Repository>) => void;
  removeRepository: (id: string) => void;

  // Resource CRUD
  setResources: (resources: Resource[]) => void;
  addResource: (resource: Resource) => void;
  updateResource: (id: string, updates: Partial<Resource>) => void;
  removeResource: (id: string) => void;

  // Folder CRUD
  setFolders: (folders: Folder[]) => void;
  addFolder: (folder: Folder) => void;
  updateFolder: (id: string, updates: Partial<Folder>) => void;
  removeFolder: (id: string) => void;

  // 状态管理
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setInitialized: (initialized: boolean) => void;

  // UI 操作
  setSelectedRepositoryId: (id: string | null) => void;
  setSelectedResourceId: (id: string | null) => void;
  setSelectedFolderId: (id: string | null) => void;
  toggleFolderExpanded: (id: string) => void;

  // 搜索操作
  setSearchQuery: (query: string) => void;
  setSearchResults: (results: SearchResultItem[]) => void;
  setSearching: (searching: boolean) => void;
  clearSearch: () => void;

  // 分页操作
  setPagination: (pagination: Partial<RepositoryState['pagination']>) => void;

  // 生命周期
  initialize: () => Promise<void>;
  reset: () => void;

  // IPC 操作
  fetchRepositories: () => Promise<void>;
  fetchResources: (repositoryId: string) => Promise<void>;
  fetchFolders: (repositoryId: string) => Promise<void>;
  searchResources: (query: string) => Promise<void>;
}

// ============ Selectors Interface ============
export interface RepositorySelectors {
  // Repository selectors
  getRepositoryById: (id: string) => Repository | undefined;
  getRepositoryByName: (name: string) => Repository | undefined;
  getFilteredRepositories: (filters?: RepositoryFilters) => Repository[];

  // Resource selectors
  getResourceById: (id: string) => Resource | undefined;
  getResourcesByRepository: (repositoryId: string) => Resource[];
  getResourcesByFolder: (folderId: string | null) => Resource[];

  // Folder selectors
  getFolderById: (id: string) => Folder | undefined;
  getFoldersByRepository: (repositoryId: string) => Folder[];
  getRootFolders: (repositoryId: string) => Folder[];
  getChildFolders: (parentId: string) => Folder[];

  // Counts
  getRepositoryCount: () => number;
  getResourceCount: () => number;
  getFolderCount: () => number;
}

// ============ Initial State ============
const initialState: RepositoryState = {
  repositories: [],
  repositoriesById: {},
  resources: [],
  resourcesById: {},
  folders: [],
  foldersById: {},
  isLoading: false,
  isInitialized: false,
  error: null,
  selectedRepositoryId: null,
  selectedResourceId: null,
  selectedFolderId: null,
  expandedFolderIds: new Set<string>(),
  searchQuery: '',
  searchResults: [],
  isSearching: false,
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
  },
  lastSyncTime: null,
};

// ============ Store ============
export const useRepositoryStore = create<
  RepositoryState & RepositoryActions & RepositorySelectors
>()(
  persist(
    (set, get) => ({
      ...initialState,

      // ========== Repository Actions ==========
      setRepositories: (repositories) =>
        set({
          repositories,
          repositoriesById: Object.fromEntries(repositories.map((r) => [r.id, r])),
          lastSyncTime: new Date(),
        }),

      addRepository: (repository) =>
        set((state) => ({
          repositories: [...state.repositories, repository],
          repositoriesById: { ...state.repositoriesById, [repository.id]: repository },
        })),

      updateRepository: (id, updates) =>
        set((state) => {
          const index = state.repositories.findIndex((r) => r.id === id);
          if (index === -1) return state;

          const updatedRepo = Object.assign(
            Object.create(Object.getPrototypeOf(state.repositories[index])),
            state.repositories[index],
            updates,
          );
          const newRepositories = [...state.repositories];
          newRepositories[index] = updatedRepo;

          return {
            repositories: newRepositories,
            repositoriesById: { ...state.repositoriesById, [id]: updatedRepo },
          };
        }),

      removeRepository: (id) =>
        set((state) => {
          const newById = { ...state.repositoriesById };
          delete newById[id];
          return {
            repositories: state.repositories.filter((r) => r.id !== id),
            repositoriesById: newById,
            selectedRepositoryId:
              state.selectedRepositoryId === id ? null : state.selectedRepositoryId,
          };
        }),

      // ========== Resource Actions ==========
      setResources: (resources) =>
        set({
          resources,
          resourcesById: Object.fromEntries(resources.map((r) => [r.id, r])),
        }),

      addResource: (resource) =>
        set((state) => ({
          resources: [...state.resources, resource],
          resourcesById: { ...state.resourcesById, [resource.id]: resource },
        })),

      updateResource: (id, updates) =>
        set((state) => {
          const index = state.resources.findIndex((r) => r.id === id);
          if (index === -1) return state;

          const updatedResource = Object.assign(
            Object.create(Object.getPrototypeOf(state.resources[index])),
            state.resources[index],
            updates,
          );
          const newResources = [...state.resources];
          newResources[index] = updatedResource;

          return {
            resources: newResources,
            resourcesById: { ...state.resourcesById, [id]: updatedResource },
          };
        }),

      removeResource: (id) =>
        set((state) => {
          const newById = { ...state.resourcesById };
          delete newById[id];
          return {
            resources: state.resources.filter((r) => r.id !== id),
            resourcesById: newById,
            selectedResourceId: state.selectedResourceId === id ? null : state.selectedResourceId,
          };
        }),

      // ========== Folder Actions ==========
      setFolders: (folders) =>
        set({
          folders,
          foldersById: Object.fromEntries(folders.map((f) => [f.id, f])),
        }),

      addFolder: (folder) =>
        set((state) => ({
          folders: [...state.folders, folder],
          foldersById: { ...state.foldersById, [folder.id]: folder },
        })),

      updateFolder: (id, updates) =>
        set((state) => {
          const index = state.folders.findIndex((f) => f.id === id);
          if (index === -1) return state;

          const updatedFolder = Object.assign(
            Object.create(Object.getPrototypeOf(state.folders[index])),
            state.folders[index],
            updates,
          );
          const newFolders = [...state.folders];
          newFolders[index] = updatedFolder;

          return {
            folders: newFolders,
            foldersById: { ...state.foldersById, [id]: updatedFolder },
          };
        }),

      removeFolder: (id) =>
        set((state) => {
          const newById = { ...state.foldersById };
          delete newById[id];
          return {
            folders: state.folders.filter((f) => f.id !== id),
            foldersById: newById,
            selectedFolderId: state.selectedFolderId === id ? null : state.selectedFolderId,
          };
        }),

      // ========== Status Actions ==========
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),
      setInitialized: (initialized) => set({ isInitialized: initialized }),

      // ========== UI Actions ==========
      setSelectedRepositoryId: (id) => set({ selectedRepositoryId: id }),
      setSelectedResourceId: (id) => set({ selectedResourceId: id }),
      setSelectedFolderId: (id) => set({ selectedFolderId: id }),

      toggleFolderExpanded: (id) =>
        set((state) => {
          const newExpanded = new Set(state.expandedFolderIds);
          if (newExpanded.has(id)) {
            newExpanded.delete(id);
          } else {
            newExpanded.add(id);
          }
          return { expandedFolderIds: newExpanded };
        }),

      // ========== Search Actions ==========
      setSearchQuery: (query) => set({ searchQuery: query }),
      setSearchResults: (results) => set({ searchResults: results }),
      setSearching: (searching) => set({ isSearching: searching }),

      clearSearch: () =>
        set({
          searchQuery: '',
          searchResults: [],
          isSearching: false,
        }),

      // ========== Pagination Actions ==========
      setPagination: (pagination) =>
        set((state) => ({
          pagination: { ...state.pagination, ...pagination },
        })),

      // ========== Lifecycle ==========
      initialize: async () => {
        const { isInitialized, fetchRepositories, setInitialized, setError } = get();
        if (isInitialized) return;

        try {
          await fetchRepositories();
          setInitialized(true);
        } catch (error) {
          setError(error instanceof Error ? error.message : 'Failed to initialize repository');
        }
      },

      reset: () => set(initialState),

      // ========== IPC Actions ==========
      fetchRepositories: async () => {
        const { setLoading, setRepositories, setError } = get();

        try {
          setLoading(true);
          setError(null);

          // application-client 已返回 Entity 对象，无需转换
          const repositories = await repositoryApplicationService.listRepositories();
          setRepositories(repositories);
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to fetch repositories';
          setError(message);
          throw error;
        } finally {
          setLoading(false);
        }
      },

      fetchResources: async (repositoryId) => {
        const { setLoading, setResources, setError } = get();

        try {
          setLoading(true);
          setError(null);

          const fileTree = await repositoryApplicationService.getFileTree(repositoryId);

          // 从文件树中提取资源
          // TODO: 根据实际文件树结构提取资源
          const resources: Resource[] = [];

          setResources(resources);
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to fetch resources';
          setError(message);
          throw error;
        } finally {
          setLoading(false);
        }
      },

      fetchFolders: async (repositoryId) => {
        const { setLoading, setFolders, setError } = get();

        try {
          setLoading(true);
          setError(null);

          const fileTree = await repositoryApplicationService.getFileTree(repositoryId);

          // 从文件树中提取文件夹
          // TODO: 根据实际文件树结构提取文件夹
          const folders: Folder[] = [];

          setFolders(folders);
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to fetch folders';
          setError(message);
          throw error;
        } finally {
          setLoading(false);
        }
      },

      searchResources: async (query) => {
        const { setSearching, setSearchResults, setSearchQuery, setError, selectedRepositoryId } =
          get();

        if (!query.trim()) {
          setSearchQuery('');
          setSearchResults([]);
          return;
        }

        try {
          setSearching(true);
          setSearchQuery(query);
          setError(null);

          const response = await repositoryApplicationService.searchResources({
            repositoryId: selectedRepositoryId || '',
            query,
            mode: 'all',
          });
          setSearchResults(response.results);
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to search resources';
          setError(message);
          throw error;
        } finally {
          setSearching(false);
        }
      },

      // ========== Selectors ==========
      getRepositoryById: (id) => get().repositoriesById[id],

      getRepositoryByName: (name) => {
        return get().repositories.find((r) => r.name === name);
      },

      getFilteredRepositories: (filters) => {
        const { repositories } = get();
        if (!filters) return repositories;

        return repositories.filter((repo) => {
          if (filters.type && repo.type !== filters.type) return false;
          if (filters.status && repo.status !== filters.status) return false;
          if (filters.searchQuery) {
            const query = filters.searchQuery.toLowerCase();
            if (!repo.name.toLowerCase().includes(query)) return false;
          }
          return true;
        });
      },

      getResourceById: (id) => get().resourcesById[id],

      getResourcesByRepository: (repositoryId) => {
        return get().resources.filter((r) => r.repositoryId === repositoryId);
      },

      getResourcesByFolder: (folderId) => {
        // ResourceDTO 没有 folderId 字段，暂时返回空数组
        // TODO: 需要在 ResourceDTO 中添加 folderId 字段或使用其他关联方式
        return [];
      },

      getFolderById: (id) => get().foldersById[id],

      getFoldersByRepository: (repositoryId) => {
        return get().folders.filter((f) => f.repositoryId === repositoryId);
      },

      getRootFolders: (repositoryId) => {
        return get().folders.filter((f) => f.repositoryId === repositoryId && !f.parentId);
      },

      getChildFolders: (parentId) => {
        return get().folders.filter((f) => f.parentId === parentId);
      },

      getRepositoryCount: () => get().repositories.length,
      getResourceCount: () => get().resources.length,
      getFolderCount: () => get().folders.length,
    }),
    {
      name: 'repository-store',
      storage: createJSONStorage(() => localStorage),
      // 只持久化 UI 状态，不持久化数据缓存
      partialize: (state) => ({
        selectedRepositoryId: state.selectedRepositoryId,
        expandedFolderIds: Array.from(state.expandedFolderIds),
      }),
      // 反序列化时恢复 Set
      merge: (persisted: any, current) => ({
        ...current,
        ...persisted,
        expandedFolderIds: new Set(persisted?.expandedFolderIds || []),
      }),
    },
  ),
);
