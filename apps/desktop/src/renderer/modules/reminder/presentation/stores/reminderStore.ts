/**
 * Reminder Store - Zustand 状态管理
 * 
 * 管理 Reminder 模块的所有状态
 * 
 * 注意：提醒系统使用 Template/Group 模型：
 * - ReminderTemplate: 提醒定义/模板
 * - ReminderGroup: 提醒分组
 * 
 * @module reminder/presentation/stores
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { ReminderStatus } from '@dailyuse/contracts/reminder';
import { ReminderTemplate, ReminderGroup } from '@dailyuse/domain-client/reminder';
import { reminderApplicationService } from '../../application/services';

// ============ State Interface ============
export interface ReminderState {
  // 数据缓存 - 提醒模板 (使用 Entity 类型)
  reminders: ReminderTemplate[];
  remindersById: Record<string, ReminderTemplate>;
  
  // 数据缓存 - 提醒分组 (使用 Entity 类型)
  groups: ReminderGroup[];
  groupsById: Record<string, ReminderGroup>;
  
  // 加载状态
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  
  // UI 状态
  selectedReminderId: string | null;
  selectedGroupId: string | null;
  filters: ReminderFilters;
  sortBy: ReminderSortOption;
}

export interface ReminderFilters {
  status?: ReminderStatus[];
  groupId?: string | null;
  searchQuery?: string;
  showPaused?: boolean;
}

export type ReminderSortOption = 
  | 'nextTriggerTime_asc' 
  | 'nextTriggerTime_desc' 
  | 'createdAt_desc' 
  | 'createdAt_asc'
  | 'title_asc';

// ============ Actions Interface ============
export interface ReminderActions {
  // Reminders CRUD (使用 Entity 类型)
  setReminders: (reminders: ReminderTemplate[]) => void;
  addReminder: (reminder: ReminderTemplate) => void;
  updateReminder: (id: string, reminder: ReminderTemplate) => void;
  removeReminder: (id: string) => void;
  
  // Groups CRUD (使用 Entity 类型)
  setGroups: (groups: ReminderGroup[]) => void;
  addGroup: (group: ReminderGroup) => void;
  updateGroup: (id: string, group: ReminderGroup) => void;
  removeGroup: (id: string) => void;
  
  // Status
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setInitialized: (initialized: boolean) => void;
  
  // UI
  setSelectedReminderId: (id: string | null) => void;
  setSelectedGroupId: (id: string | null) => void;
  setFilters: (filters: Partial<ReminderFilters>) => void;
  resetFilters: () => void;
  setSortBy: (sort: ReminderSortOption) => void;
  
  // Lifecycle
  initialize: () => Promise<void>;
  reset: () => void;
  
  // IPC Operations - 将在实际集成时实现
  fetchReminders: () => Promise<void>;
  fetchGroups: () => Promise<void>;
  snoozeReminder: (id: string, minutes: number) => Promise<void>;
  dismissReminder: (id: string) => Promise<void>;
  toggleReminderEnabled: (id: string) => Promise<void>;
}

// ============ Selectors Interface ============
export interface ReminderSelectors {
  getReminderById: (id: string) => ReminderTemplate | undefined;
  getGroupById: (id: string) => ReminderGroup | undefined;
  getRemindersByGroup: (groupId: string) => ReminderTemplate[];
  getActiveReminders: () => ReminderTemplate[];
  getPausedReminders: () => ReminderTemplate[];
  getUpcomingReminders: () => ReminderTemplate[];
  getFilteredReminders: () => ReminderTemplate[];
  getReminderCount: () => number;
  getGroupCount: () => number;
}

// ============ Initial State ============
const defaultFilters: ReminderFilters = {
  status: undefined,
  groupId: undefined,
  searchQuery: '',
  showPaused: true,
};

const initialState: ReminderState = {
  reminders: [],
  remindersById: {},
  groups: [],
  groupsById: {},
  isLoading: false,
  isInitialized: false,
  error: null,
  selectedReminderId: null,
  selectedGroupId: null,
  filters: defaultFilters,
  sortBy: 'nextTriggerTime_asc',
};

// ============ Store ============
export const useReminderStore = create<ReminderState & ReminderActions & ReminderSelectors>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      // ========== Reminders CRUD ==========
      setReminders: (reminders) => set({
        reminders,
        remindersById: Object.fromEntries(reminders.map(r => [r.uuid, r])),
      }),
      
      addReminder: (reminder) => set((state) => ({
        reminders: [...state.reminders, reminder],
        remindersById: { ...state.remindersById, [reminder.uuid]: reminder },
      })),
      
      updateReminder: (id, reminder) => set((state) => {
        const index = state.reminders.findIndex(r => r.uuid === id);
        if (index === -1) return state;
        
        const newReminders = [...state.reminders];
        newReminders[index] = reminder;
        
        return {
          reminders: newReminders,
          remindersById: { ...state.remindersById, [id]: reminder },
        };
      }),
      
      removeReminder: (id) => set((state) => {
        const newById = { ...state.remindersById };
        delete newById[id];
        return {
          reminders: state.reminders.filter(r => r.uuid !== id),
          remindersById: newById,
          selectedReminderId: state.selectedReminderId === id ? null : state.selectedReminderId,
        };
      }),
      
      // ========== Groups CRUD ==========
      setGroups: (groups) => set({
        groups,
        groupsById: Object.fromEntries(groups.map(g => [g.uuid, g])),
      }),
      
      addGroup: (group) => set((state) => ({
        groups: [...state.groups, group],
        groupsById: { ...state.groupsById, [group.uuid]: group },
      })),
      
      updateGroup: (id, group) => set((state) => {
        const index = state.groups.findIndex(g => g.uuid === id);
        if (index === -1) return state;
        
        const newGroups = [...state.groups];
        newGroups[index] = group;
        
        return {
          groups: newGroups,
          groupsById: { ...state.groupsById, [id]: group },
        };
      }),
      
      removeGroup: (id) => set((state) => {
        const newById = { ...state.groupsById };
        delete newById[id];
        return {
          groups: state.groups.filter(g => g.uuid !== id),
          groupsById: newById,
          selectedGroupId: state.selectedGroupId === id ? null : state.selectedGroupId,
        };
      }),
      
      // ========== Status ==========
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      setInitialized: (isInitialized) => set({ isInitialized }),
      
      // ========== UI ==========
      setSelectedReminderId: (selectedReminderId) => set({ selectedReminderId }),
      setSelectedGroupId: (selectedGroupId) => set({ selectedGroupId }),
      setFilters: (filters) => set((state) => ({
        filters: { ...state.filters, ...filters },
      })),
      resetFilters: () => set({ filters: defaultFilters }),
      setSortBy: (sortBy) => set({ sortBy }),
      
      // ========== Lifecycle ==========
      initialize: async () => {
        const { isInitialized, fetchReminders, fetchGroups, setInitialized, setError } = get();
        if (isInitialized) return;
        
        try {
          await Promise.all([
            fetchReminders(),
            fetchGroups(),
          ]);
          setInitialized(true);
        } catch (error) {
          setError(error instanceof Error ? error.message : 'Failed to initialize reminders');
        }
      },
      
      reset: () => set(initialState),
      
      // ========== IPC Operations ==========
      fetchReminders: async () => {
        const { setLoading, setReminders, setError } = get();
        
        try {
          setLoading(true);
          setError(null);
          
          // 使用 ApplicationService 获取提醒 - 已返回 Entity 对象
          const result = await reminderApplicationService.listReminderTemplates();
          setReminders(result.templates);
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to fetch reminders';
          setError(message);
          throw error;
        } finally {
          setLoading(false);
        }
      },
      
      fetchGroups: async () => {
        const { setLoading, setGroups, setError } = get();
        
        try {
          setLoading(true);
          
          // 使用 ApplicationService 获取分组 - 已返回 Entity 对象
          const result = await reminderApplicationService.listReminderGroups();
          setGroups(result.groups);
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to fetch reminder groups';
          setError(message);
          throw error;
        } finally {
          setLoading(false);
        }
      },
      
      snoozeReminder: async (id, _minutes) => {
        const { setLoading, setError, updateReminder } = get();
        
        try {
          setLoading(true);
          
          // 使用 ApplicationService 延迟提醒 - 已返回 Entity 对象
          // TODO: ApplicationService 暂不支持 snooze，使用 toggle 作为临时方案
          const entity = await reminderApplicationService.toggleTemplateEnabled(id);
          updateReminder(id, entity);
        } catch (error) {
          setError(error instanceof Error ? error.message : 'Failed to snooze reminder');
          throw error;
        } finally {
          setLoading(false);
        }
      },
      
      dismissReminder: async (id) => {
        const { setLoading, setError, updateReminder } = get();
        
        try {
          setLoading(true);
          
          // 使用 ApplicationService 解除提醒 - 已返回 Entity 对象
          // TODO: ApplicationService 暂不支持 dismiss，使用 toggle 作为临时方案
          const entity = await reminderApplicationService.toggleTemplateEnabled(id);
          updateReminder(id, entity);
        } catch (error) {
          setError(error instanceof Error ? error.message : 'Failed to dismiss reminder');
          throw error;
        } finally {
          setLoading(false);
        }
      },
      
      toggleReminderEnabled: async (id) => {
        const { setLoading, updateReminder, remindersById, setError } = get();
        const reminder = remindersById[id];
        if (!reminder) return;
        
        try {
          setLoading(true);
          
          // 使用 ApplicationService 切换启用状态 - 已返回 Entity 对象
          const entity = await reminderApplicationService.toggleTemplateEnabled(id);
          updateReminder(id, entity);
        } catch (error) {
          setError(error instanceof Error ? error.message : 'Failed to toggle reminder');
          throw error;
        } finally {
          setLoading(false);
        }
      },
      
      // ========== Selectors ==========
      getReminderById: (id) => get().remindersById[id],
      getGroupById: (id) => get().groupsById[id],
      
      getRemindersByGroup: (groupId) => {
        const { reminders } = get();
        return reminders.filter(r => r.groupUuid === groupId);
      },
      
      getActiveReminders: () => {
        const { reminders } = get();
        return reminders.filter(r => r.isActive && !r.isPaused);
      },
      
      getPausedReminders: () => {
        const { reminders } = get();
        return reminders.filter(r => r.isPaused);
      },
      
      getUpcomingReminders: () => {
        const { reminders } = get();
        const now = Date.now();
        const oneHourLater = now + 60 * 60 * 1000;
        
        return reminders
          .filter(r => r.isActive && r.nextTriggerAt && r.nextTriggerAt <= oneHourLater)
          .sort((a, b) => (a.nextTriggerAt ?? 0) - (b.nextTriggerAt ?? 0));
      },
      
      getFilteredReminders: () => {
        const { reminders, filters, sortBy } = get();
        
        let filtered = [...reminders];
        
        // 按状态过滤
        if (filters.status?.length) {
          filtered = filtered.filter(r => filters.status!.includes(r.status));
        }
        
        // 按分组过滤
        if (filters.groupId) {
          filtered = filtered.filter(r => r.groupUuid === filters.groupId);
        }
        
        // 隐藏暂停的
        if (!filters.showPaused) {
          filtered = filtered.filter(r => !r.isPaused);
        }
        
        // 搜索
        if (filters.searchQuery) {
          const query = filters.searchQuery.toLowerCase();
          filtered = filtered.filter(r => 
            r.title.toLowerCase().includes(query) ||
            r.description?.toLowerCase().includes(query)
          );
        }
        
        // 排序
        filtered.sort((a, b) => {
          switch (sortBy) {
            case 'nextTriggerTime_asc':
              return (a.nextTriggerAt ?? Infinity) - (b.nextTriggerAt ?? Infinity);
            case 'nextTriggerTime_desc':
              return (b.nextTriggerAt ?? 0) - (a.nextTriggerAt ?? 0);
            case 'createdAt_desc':
              return b.createdAt - a.createdAt;
            case 'createdAt_asc':
              return a.createdAt - b.createdAt;
            case 'title_asc':
              return a.title.localeCompare(b.title);
            default:
              return 0;
          }
        });
        
        return filtered;
      },
      
      getReminderCount: () => get().reminders.length,
      getGroupCount: () => get().groups.length,
    }),
    {
      name: 'reminder-store',
      storage: createJSONStorage(() => localStorage),
      // 只持久化 UI 状态
      partialize: (state) => ({
        selectedReminderId: state.selectedReminderId,
        selectedGroupId: state.selectedGroupId,
        filters: state.filters,
        sortBy: state.sortBy,
      }),
    }
  )
);

// ============ Convenience Hooks ============
export const useReminders = () => useReminderStore((state) => state.reminders);
export const useReminderGroups = () => useReminderStore((state) => state.groups);
export const useReminderLoading = () => useReminderStore((state) => state.isLoading);
export const useSelectedReminderId = () => useReminderStore((state) => state.selectedReminderId);
