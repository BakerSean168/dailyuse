import { ref, computed } from 'vue';
import type {
  ScheduleClientDTO,
  CreateScheduleRequest,
  UpdateScheduleRequest,
  GetSchedulesByTimeRangeRequest,
} from '@dailyuse/contracts/schedule';
import { scheduleApplicationService as scheduleEventApplicationService } from '@dailyuse/schedule/application-client';
import { getGlobalMessage } from '@dailyuse/ui-vuetify';

/**
 * Schedule Event Composable
 * 日程事件状态管理
 *
 * 🔄 重构说明（方案 A - 简化版）：
 * - Composable 负责协调 ApplicationService 和状态管理
 * - Service 直接返回 DTO 或抛出错误
 * - Composable 使用 try/catch 处理错误 + 显示通知
 *
 * Story 4-1: Schedule Event CRUD
 */

/**
 * Schedule Event Store (module-level singleton)
 */
const schedules = ref<Map<string, ScheduleClientDTO>>(new Map());
const activeScheduleUuid = ref<string | null>(null);
const isLoading = ref(false);
const error = ref<Error | null>(null);

/**
 * useScheduleEvent Composable
 */
export function useScheduleEvent() {
  const { success: showSuccess, error: showError, warning: showWarning } = getGlobalMessage();

  // ============ Computed ============

  const activeSchedule = computed(() => {
    if (!activeScheduleUuid.value) return null;
    return schedules.value.get(activeScheduleUuid.value) || null;
  });

  const schedulesList = computed(() => {
    return Array.from(schedules.value.values());
  });

  const schedulesCount = computed(() => {
    return schedules.value.size;
  });

  // ============ Actions ============

  /**
   * 创建日程事件
   */
  async function createSchedule(data: CreateScheduleRequest): Promise<ScheduleClientDTO | null> {
    try {
      isLoading.value = true;
      error.value = null;

      const schedule = await scheduleEventApplicationService.createSchedule(data);
      schedules.value.set(schedule.uuid, schedule);
      showSuccess('日程创建成功');
      return schedule;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '创建日程失败';
      error.value = err instanceof Error ? err : new Error(errorMsg);
      showError(errorMsg);
      return null;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * 获取日程事件详情
   */
  async function getSchedule(
    uuid: string,
    forceRefresh = false,
  ): Promise<ScheduleClientDTO | null> {
    // Cache-first strategy
    if (!forceRefresh && schedules.value.has(uuid)) {
      const cached = schedules.value.get(uuid);
      if (cached) {
        activeScheduleUuid.value = uuid;
        return cached;
      }
    }

    try {
      isLoading.value = true;
      error.value = null;

      const schedule = await scheduleEventApplicationService.getSchedule(uuid);
      schedules.value.set(schedule.uuid, schedule);
      activeScheduleUuid.value = uuid;
      return schedule;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '获取日程详情失败';
      error.value = err instanceof Error ? err : new Error(errorMsg);
      showError(errorMsg);
      return null;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * 获取账户的所有日程事件
   */
  async function getSchedulesByAccount(forceRefresh = false): Promise<ScheduleClientDTO[]> {
    // Cache-first strategy
    if (!forceRefresh && schedules.value.size > 0) {
      return schedulesList.value;
    }

    try {
      isLoading.value = true;
      error.value = null;

      const fetchedSchedules = await scheduleEventApplicationService.getSchedulesByAccount();
      // Clear old cache and update
      schedules.value.clear();
      fetchedSchedules.forEach((schedule) => {
        schedules.value.set(schedule.uuid, schedule);
      });
      return fetchedSchedules;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '获取日程列表失败';
      error.value = err instanceof Error ? err : new Error(errorMsg);
      showError(errorMsg);
      return [];
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * 获取指定时间范围内的日程事件
   */
  async function getSchedulesByTimeRange(
    params: GetSchedulesByTimeRangeRequest,
  ): Promise<ScheduleClientDTO[]> {
    try {
      isLoading.value = true;
      error.value = null;

      const fetchedSchedules =
        await scheduleEventApplicationService.getSchedulesByTimeRange(params);
      // Update cache (merge with existing)
      fetchedSchedules.forEach((schedule) => {
        schedules.value.set(schedule.uuid, schedule);
      });
      return fetchedSchedules;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '获取日程列表失败';
      error.value = err instanceof Error ? err : new Error(errorMsg);
      showError(errorMsg);
      return [];
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * 更新日程事件
   */
  async function updateSchedule(
    uuid: string,
    data: UpdateScheduleRequest,
  ): Promise<ScheduleClientDTO | null> {
    try {
      isLoading.value = true;
      error.value = null;

      const updatedSchedule = await scheduleEventApplicationService.updateSchedule(uuid, data);
      schedules.value.set(updatedSchedule.uuid, updatedSchedule);
      showSuccess('日程更新成功');
      return updatedSchedule;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '更新日程失败';
      error.value = err instanceof Error ? err : new Error(errorMsg);
      showError(errorMsg);
      return null;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * 删除日程事件
   */
  async function deleteSchedule(uuid: string): Promise<boolean> {
    try {
      isLoading.value = true;
      error.value = null;

      await scheduleEventApplicationService.deleteSchedule(uuid);
      schedules.value.delete(uuid);
      if (activeScheduleUuid.value === uuid) {
        activeScheduleUuid.value = null;
      }
      showSuccess('日程删除成功');
      return true;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '删除日程失败';
      error.value = err instanceof Error ? err : new Error(errorMsg);
      showError(errorMsg);
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * 设置活动日程
   */
  function setActiveSchedule(uuid: string | null) {
    if (uuid && !schedules.value.has(uuid)) {
      showWarning('日程不存在');
      return;
    }
    activeScheduleUuid.value = uuid;
  }

  /**
   * 加载指定时间范围的日程（简化版，用于周视图）
   * Story 4-4: Week View Calendar
   */
  async function loadSchedulesByTimeRange(
    startTime: number,
    endTime: number,
  ): Promise<ScheduleClientDTO[]> {
    return getSchedulesByTimeRange({ startTime, endTime });
  }

  /**
   * 清空缓存
   */
  function clearCache() {
    schedules.value.clear();
    activeScheduleUuid.value = null;
    error.value = null;
  }

  return {
    // State
    schedules: schedulesList,
    activeSchedule,
    schedulesCount,
    isLoading,
    error,

    // Actions
    createSchedule,
    getSchedule,
    getSchedulesByAccount,
    getSchedulesByTimeRange,
    loadSchedulesByTimeRange,
    updateSchedule,
    deleteSchedule,
    setActiveSchedule,
    clearCache,
  };
}
