/**
 * Goal Store - Zustand 状态管理
 * 
 * 管理 Goal 模块的所有状态，包括：
 * - 目标列表缓存
 * - 加载/错误状态
 * - UI 状态（选中、过滤等）
 * 
 * @module goal/presentation/stores
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { 
  GoalStatus,
  CreateGoalRequest,
  UpdateGoalRequest,
} from '@dailyuse/contracts/goal';
import type { ImportanceLevel } from '@dailyuse/contracts/shared';
import { Goal, GoalFolder } from '@dailyuse/goal/domain-client';
import { goalApplicationService } from '@dailyuse/goal/application-client';

// ============ State Interface ============
export interface GoalState {
  // 数据缓存 - 使用 Entity 类型
  goals: Goal[];
  goalsById: Record<string, Goal>;
  folders: GoalFolder[];
  foldersById: Record<string, GoalFolder>;
  
  // 加载状态
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  
  // UI 状态
  selectedGoalId: string | null;
  expandedGoalIds: Set<string>;
  filters: GoalFilters;
  sortBy: GoalSortOption;
  viewMode: 'list' | 'tree' | 'kanban';
}

export interface GoalFilters {
  status?: GoalStatus[];
  folderId?: string | null;
  importance?: ImportanceLevel[];
  searchQuery?: string;
  dateRange?: {
    start: Date | null;
    end: Date | null;
  };
}

export type GoalSortOption = 
  | 'createdAt_desc' 
  | 'createdAt_asc' 
  | 'updatedAt_desc' 
  | 'name_asc' 
  | 'name_desc'
  | 'priority_desc'
  | 'dueDate_asc';

// ============ Actions Interface ============
export interface GoalActions {
  // CRUD 操作 - 使用 Entity 类型
  setGoals: (goals: Goal[]) => void;
  addGoal: (goal: Goal) => void;
  updateGoal: (id: string, goal: Goal) => void;
  removeGoal: (id: string) => void;
  
  // Folder 操作 - 使用 Entity 类型
  setFolders: (folders: GoalFolder[]) => void;
  addFolder: (folder: GoalFolder) => void;
  updateFolder: (id: string, folder: GoalFolder) => void;
  removeFolder: (id: string) => void;
  
  // 状态管理
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setInitialized: (initialized: boolean) => void;
  
  // UI 操作
  setSelectedGoalId: (id: string | null) => void;
  toggleGoalExpanded: (id: string) => void;
  setFilters: (filters: Partial<GoalFilters>) => void;
  resetFilters: () => void;
  setSortBy: (sort: GoalSortOption) => void;
  setViewMode: (mode: 'list' | 'tree' | 'kanban') => void;
  
  // 生命周期
  initialize: () => Promise<void>;
  reset: () => void;
  
  // Data Operations - 通过 ApplicationService
  fetchGoals: () => Promise<void>;
  createGoal: (dto: CreateGoalRequest) => Promise<Goal>;
  updateGoalById: (id: string, dto: UpdateGoalRequest) => Promise<Goal>;
  deleteGoal: (id: string) => Promise<void>;
  moveGoalToFolder: (goalId: string, folderId: string | null) => Promise<void>;
}

// ============ Selectors Interface ============
export interface GoalSelectors {
  getGoalById: (id: string) => Goal | undefined;
  getGoalsByFolder: (folderId: string | null) => Goal[];
  getRootGoals: () => Goal[];
  getChildGoals: (parentId: string) => Goal[];
  getFilteredGoals: () => Goal[];
  getGoalCount: () => number;
  getFolderById: (id: string) => GoalFolder | undefined;
}

// ============ Initial State ============
const defaultFilters: GoalFilters = {
  status: undefined,
  folderId: undefined,
  importance: undefined,
  searchQuery: '',
  dateRange: undefined,
};

const initialState: GoalState = {
  goals: [],
  goalsById: {},
  folders: [],
  foldersById: {},
  isLoading: false,
  isInitialized: false,
  error: null,
  selectedGoalId: null,
  expandedGoalIds: new Set<string>(),
  filters: defaultFilters,
  sortBy: 'createdAt_desc',
  viewMode: 'list',
};

// ============ Store ============
export const useGoalStore = create<GoalState & GoalActions & GoalSelectors>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      // ========== CRUD Actions ==========
      setGoals: (goals) => set({
        goals,
        goalsById: Object.fromEntries(goals.map(g => [g.uuid, g])),
      }),
      
      addGoal: (goal) => set((state) => ({
        goals: [...state.goals, goal],
        goalsById: { ...state.goalsById, [goal.uuid]: goal },
      })),
      
      updateGoal: (id, goal) => set((state) => {
        const index = state.goals.findIndex(g => g.uuid === id);
        if (index === -1) return state;
        
        const newGoals = [...state.goals];
        newGoals[index] = goal;
        
        return {
          goals: newGoals,
          goalsById: { ...state.goalsById, [id]: goal },
        };
      }),
      
      removeGoal: (id) => set((state) => {
        const newById = { ...state.goalsById };
        delete newById[id];
        return {
          goals: state.goals.filter(g => g.uuid !== id),
          goalsById: newById,
          selectedGoalId: state.selectedGoalId === id ? null : state.selectedGoalId,
        };
      }),
      
      // ========== Folder Actions ==========
      setFolders: (folders) => set({
        folders,
        foldersById: Object.fromEntries(folders.map(f => [f.uuid, f])),
      }),
      
      addFolder: (folder) => set((state) => ({
        folders: [...state.folders, folder],
        foldersById: { ...state.foldersById, [folder.uuid]: folder },
      })),
      
      updateFolder: (id, folder) => set((state) => {
        const index = state.folders.findIndex(f => f.uuid === id);
        if (index === -1) return state;
        
        const newFolders = [...state.folders];
        newFolders[index] = folder;
        
        return {
          folders: newFolders,
          foldersById: { ...state.foldersById, [id]: folder },
        };
      }),
      
      removeFolder: (id) => set((state) => {
        const newById = { ...state.foldersById };
        delete newById[id];
        return {
          folders: state.folders.filter(f => f.uuid !== id),
          foldersById: newById,
        };
      }),
      
      // ========== Status Actions ==========
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      setInitialized: (isInitialized) => set({ isInitialized }),
      
      // ========== UI Actions ==========
      setSelectedGoalId: (selectedGoalId) => set({ selectedGoalId }),
      
      toggleGoalExpanded: (id) => set((state) => {
        const newSet = new Set(state.expandedGoalIds);
        if (newSet.has(id)) {
          newSet.delete(id);
        } else {
          newSet.add(id);
        }
        return { expandedGoalIds: newSet };
      }),
      
      setFilters: (filters) => set((state) => ({
        filters: { ...state.filters, ...filters },
      })),
      
      resetFilters: () => set({ filters: defaultFilters }),
      
      setSortBy: (sortBy) => set({ sortBy }),
      
      setViewMode: (viewMode) => set({ viewMode }),
        
        // ========== Lifecycle ==========
        initialize: async () => {
          const { isInitialized, fetchGoals, setInitialized, setError } = get();
          if (isInitialized) return;
          
          try {
            await fetchGoals();
            setInitialized(true);
          } catch (error) {
            setError(error instanceof Error ? error.message : 'Failed to initialize goals');
          }
        },
        
        reset: () => set(initialState),
        
        // ========== Data Operations - 通过 ApplicationService ==========
        fetchGoals: async () => {
          const { setLoading, setGoals, setFolders, setError } = get();
          
          try {
            setLoading(true);
            setError(null);
            
            // 通过 ApplicationService 获取数据（返回 Entity）
            const { goals } = await goalApplicationService.listGoals();
            setGoals(goals);
            
            // 获取文件夹列表
            const folders = await goalApplicationService.listFolders();
            setFolders(folders);
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to fetch goals';
            setError(message);
            throw error;
          } finally {
            setLoading(false);
          }
        },
        
        createGoal: async (dto) => {
          const { setLoading, addGoal, setError } = get();
          
          try {
            setLoading(true);
            setError(null);
            
            // 通过 ApplicationService 创建（返回 Entity）
            const newGoal = await goalApplicationService.createGoal(dto);
            addGoal(newGoal);
            return newGoal;
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to create goal';
            setError(message);
            throw error;
          } finally {
            setLoading(false);
          }
        },
        
        updateGoalById: async (id, dto) => {
          const { setLoading, updateGoal, setError } = get();
          
          try {
            setLoading(true);
            setError(null);
            
            // 通过 ApplicationService 更新（返回 Entity）
            const updatedGoal = await goalApplicationService.updateGoal(id, dto);
            updateGoal(id, updatedGoal);
            return updatedGoal;
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to update goal';
            setError(message);
            throw error;
          } finally {
            setLoading(false);
          }
        },
        
        deleteGoal: async (id) => {
          const { setLoading, removeGoal, setError } = get();
          
          try {
            setLoading(true);
            setError(null);
            
            // 通过 ApplicationService 删除
            await goalApplicationService.deleteGoal(id);
            removeGoal(id);
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to delete goal';
            setError(message);
            throw error;
          } finally {
            setLoading(false);
          }
        },
        
        moveGoalToFolder: async (goalId, folderId) => {
          const { setLoading, updateGoal, setError, getGoalById } = get();
          
          try {
            setLoading(true);
            setError(null);
            
            // 通过 ApplicationService 更新 folderUuid
            const updatedGoal = await goalApplicationService.updateGoal(goalId, { folderUuid: folderId ?? undefined });
            updateGoal(goalId, updatedGoal);
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to move goal';
            setError(message);
            throw error;
          } finally {
            setLoading(false);
          }
        },
        
        // ========== Selectors ==========
        getGoalById: (id) => get().goalsById[id],
        
        getGoalsByFolder: (folderId) => {
          const { goals } = get();
          return goals.filter(g => g.folderUuid === folderId);
        },
        
        getRootGoals: () => {
          const { goals } = get();
          return goals.filter(g => !g.parentGoalUuid);
        },
        
        getChildGoals: (parentId) => {
          const { goals } = get();
          return goals.filter(g => g.parentGoalUuid === parentId);
        },
        
        getFilteredGoals: () => {
          const { goals, filters, sortBy } = get();
          
          let filtered = [...goals];
          
          // 应用过滤器
          if (filters.status?.length) {
            filtered = filtered.filter(g => filters.status!.includes(g.status));
          }
          
          if (filters.folderId !== undefined) {
            filtered = filtered.filter(g => g.folderUuid === filters.folderId);
          }
          
          if (filters.importance?.length) {
            filtered = filtered.filter(g => filters.importance!.includes(g.importance));
          }
          
          if (filters.searchQuery) {
            const query = filters.searchQuery.toLowerCase();
            filtered = filtered.filter(g => 
              g.title.toLowerCase().includes(query) ||
              g.description?.toLowerCase().includes(query)
            );
          }
          
          // 应用排序
          filtered.sort((a, b) => {
            switch (sortBy) {
              case 'createdAt_desc':
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
              case 'createdAt_asc':
                return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
              case 'updatedAt_desc':
                return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
              case 'name_asc':
                return a.title.localeCompare(b.title);
              case 'name_desc':
                return b.title.localeCompare(a.title);
              default:
                return 0;
            }
          });
          
          return filtered;
        },
        
        getGoalCount: () => get().goals.length,
        
        getFolderById: (id) => get().foldersById[id],
      }),
      {
        name: 'goal-store',
        storage: createJSONStorage(() => localStorage),
        // 只持久化 UI 状态，不持久化数据缓存
        partialize: (state) => ({
          selectedGoalId: state.selectedGoalId,
          expandedGoalIds: Array.from(state.expandedGoalIds),
          filters: state.filters,
          sortBy: state.sortBy,
          viewMode: state.viewMode,
        }),
        // 恢复时转换 expandedGoalIds 回 Set
        merge: (persistedState: unknown, currentState) => {
          const persisted = persistedState as Partial<GoalState> & { expandedGoalIds?: string[] };
          return {
            ...currentState,
            ...persisted,
            expandedGoalIds: new Set(persisted.expandedGoalIds || []),
          };
        },
      }
    )
);

// ============ Hooks for selective subscription ============
export const useGoals = () => useGoalStore((state) => state.goals);
export const useGoalLoading = () => useGoalStore((state) => state.isLoading);
export const useGoalError = () => useGoalStore((state) => state.error);
export const useSelectedGoalId = () => useGoalStore((state) => state.selectedGoalId);
export const useGoalFilters = () => useGoalStore((state) => state.filters);
