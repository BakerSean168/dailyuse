/**
 * Schedule Store - Zustand 状态管理
 *
 * 管理 Schedule 模块的所有状态，包括：
 * - 日程事件列表缓存 (Schedule Events) - 使用 ScheduleClientDTO
 * - 加载/错误状态
 * - UI 状态
 *
 * EPIC-015 Entity 升级说明:
 * - 当前 Store 管理的是 Schedule Event（日程事件），不是 ScheduleTask
 * - domain-client 中目前只有 ScheduleTask Entity，没有 Schedule Entity
 * - 因此暂时保留使用 ScheduleClientDTO
 *
 * TODO: 待 Schedule Entity 创建后，升级为 Entity 类型
 * - 创建 packages/domain-client/src/schedule/aggregates/Schedule.ts
 * - 更新 Store 使用 Schedule Entity
 * - 更新 ApplicationService 返回 Schedule Entity
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  ScheduleClientDTO,
  CreateScheduleRequest,
  UpdateScheduleRequest,
} from '@dailyuse/contracts/schedule';
import { scheduleApplicationService } from '@dailyuse/application-client/schedule';

// Re-export types from contracts for backward compatibility
export type { ScheduleClientDTO, CreateScheduleRequest, UpdateScheduleRequest };

// ============ Types ============
export interface ScheduleState {
  schedules: ScheduleClientDTO[];
  schedulesById: Record<string, ScheduleClientDTO>;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  selectedScheduleId: string | null;
  viewDate: Date;
  viewMode: 'day' | 'week' | 'month';
}

export interface ScheduleActions {
  setSchedules: (schedules: ScheduleClientDTO[]) => void;
  addSchedule: (schedule: ScheduleClientDTO) => void;
  updateSchedule: (id: string, updates: Partial<ScheduleClientDTO>) => void;
  removeSchedule: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setInitialized: (initialized: boolean) => void;
  setSelectedScheduleId: (id: string | null) => void;
  setViewDate: (date: Date) => void;
  setViewMode: (mode: 'day' | 'week' | 'month') => void;
  initialize: () => Promise<void>;
  reset: () => void;
  fetchSchedules: (start: Date, end: Date) => Promise<void>;
  createSchedule: (dto: CreateScheduleRequest) => Promise<ScheduleClientDTO>;
  updateScheduleById: (id: string, dto: UpdateScheduleRequest) => Promise<ScheduleClientDTO>;
  deleteSchedule: (id: string) => Promise<void>;
}

export interface ScheduleSelectors {
  getScheduleById: (id: string) => ScheduleClientDTO | undefined;
  getSchedulesForDate: (date: Date) => ScheduleClientDTO[];
  getSchedulesForWeek: (weekStart: Date) => ScheduleClientDTO[];
}

type ScheduleStore = ScheduleState & ScheduleActions & ScheduleSelectors;

// ============ Initial State ============
const initialState: ScheduleState = {
  schedules: [],
  schedulesById: {},
  isLoading: false,
  isInitialized: false,
  error: null,
  selectedScheduleId: null,
  viewDate: new Date(),
  viewMode: 'week',
};

// ============ Store ============
export const useScheduleStore = create<ScheduleStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      setSchedules: (schedules) => {
        const byId = Object.fromEntries(schedules.map((s) => [s.uuid, s]));
        set({ schedules, schedulesById: byId });
      },

      addSchedule: (schedule) =>
        set((state) => ({
          schedules: [...state.schedules, schedule],
          schedulesById: { ...state.schedulesById, [schedule.uuid]: schedule },
        })),

      updateSchedule: (id, updates) =>
        set((state) => {
          const index = state.schedules.findIndex((s) => s.uuid === id);
          if (index === -1) return state;

          const updated = { ...state.schedules[index], ...updates };
          const newSchedules = [...state.schedules];
          newSchedules[index] = updated;

          return {
            schedules: newSchedules,
            schedulesById: { ...state.schedulesById, [id]: updated },
          };
        }),

      removeSchedule: (id) =>
        set((state) => {
          const { [id]: _, ...rest } = state.schedulesById;
          return {
            schedules: state.schedules.filter((s) => s.uuid !== id),
            schedulesById: rest,
          };
        }),

      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      setInitialized: (isInitialized) => set({ isInitialized }),
      setSelectedScheduleId: (selectedScheduleId) => set({ selectedScheduleId }),
      setViewDate: (viewDate) => set({ viewDate }),
      setViewMode: (viewMode) => set({ viewMode }),

      initialize: async () => {
        const state = get();
        if (state.isInitialized) return;

        try {
          const start = new Date(state.viewDate);
          start.setDate(start.getDate() - 30);
          const end = new Date(state.viewDate);
          end.setDate(end.getDate() + 30);

          await state.fetchSchedules(start, end);
          set({ isInitialized: true });
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to initialize' });
        }
      },

      reset: () => set(initialState),

      fetchSchedules: async (start, end) => {
        set({ isLoading: true, error: null });

        try {
          // 使用 ApplicationService 获取日程
          const schedules = await scheduleApplicationService.getSchedulesByTimeRange({
            startTime: start.getTime(),
            endTime: end.getTime(),
          });

          get().setSchedules(schedules);
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to fetch' });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      createSchedule: async (dto) => {
        set({ isLoading: true, error: null });

        try {
          // 使用 ApplicationService 创建日程事件
          const result = await scheduleApplicationService.createScheduleEvent(dto as any);

          get().addSchedule(result);
          return result;
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to create' });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      updateScheduleById: async (id, dto) => {
        set({ isLoading: true, error: null });

        try {
          // 使用 ApplicationService 更新日程事件
          const result = await scheduleApplicationService.updateScheduleEvent(id, dto);

          get().updateSchedule(id, result);
          return result;
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to update' });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      deleteSchedule: async (id) => {
        set({ isLoading: true, error: null });

        try {
          // 使用 ApplicationService 删除日程事件
          await scheduleApplicationService.deleteScheduleEvent(id);

          get().removeSchedule(id);
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to delete' });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      // Selectors
      getScheduleById: (id) => get().schedulesById[id],

      getSchedulesForDate: (date) => {
        const dateStr = date.toISOString().split('T')[0];
        return get().schedules.filter((s) => {
          const startStr = new Date(s.startTime).toISOString().split('T')[0];
          return startStr === dateStr;
        });
      },

      getSchedulesForWeek: (weekStart) => {
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 7);

        return get().schedules.filter((s) => {
          const start = new Date(s.startTime);
          return start >= weekStart && start < weekEnd;
        });
      },
    }),
    {
      name: 'schedule-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        viewMode: state.viewMode,
      }),
    },
  ),
);

export const useSchedules = () => useScheduleStore((state) => state.schedules);
export const useScheduleLoading = () => useScheduleStore((state) => state.isLoading);
