import { ref, computed, reactive } from 'vue';
import type {
  GoalClientDTO,
  KeyResultClientDTO,
  CreateGoalRequest,
  UpdateGoalRequest,
  KeyResultWeightSnapshotServerDTO,
} from '@dailyuse/contracts/goal';
import { goalApplicationService as WeightSnapshotWebApplicationService } from '@dailyuse/application-client/goal';
import { getGoalStore } from '../stores/goalStore';
import { getGlobalMessage } from '@dailyuse/ui-vuetify';

/**
 * Weight Snapshot 业务逻辑 Composable
 * 提供权重快照相关的状态和方法
 *
 * **功能**:
 * - 更新 KR 权重
 * - 查询快照历史
 * - 获取趋势数据
 * - 权重对比
 */
export function useWeightSnapshot() {
  const service = new WeightSnapshotWebApplicationService();
  const goalStore = getGoalStore();
  const message = getGlobalMessage();

  // ===== 响应式状态 =====
  const isLoading = computed(() => goalStore.isLoading);
  const error = computed(() => goalStore.error);

  // ===== 本地状态 =====
  const snapshots = ref<KeyResultWeightSnapshotServerDTO[]>([]);
  const pagination = reactive({
    total: 0,
    page: 1,
    pageSize: 20,
    totalPages: 0,
  });

  const trendData = ref<{
    timePoints: number[];
    keyResults: Array<{
      uuid: string;
      title: string;
      data: Array<{ time: number; weight: number }>;
    }>;
  } | null>(null);

  const comparisonData = ref<{
    keyResults: Array<{ uuid: string; title: string }>;
    timePoints: number[];
    comparisons: Record<string, number[]>;
    deltas: Record<string, number[]>;
  } | null>(null);

  // ===== 权重更新 =====

  /**
   * 更新 KeyResult 权重
   *
   * @param goalUuid - Goal UUID
   * @param krUuid - KeyResult UUID
   * @param newWeight - 新权重值 (0-100)
   * @param reason - 调整原因（可选）
   *
   * @example
   * ```typescript
   * await updateWeight('goal-123', 'kr-456', 50, '根据Q1反馈调整');
   * ```
   */
  const updateWeight = async (
    goalUuid: string,
    krUuid: string,
    newWeight: number,
    reason?: string,
  ) => {
    try {
      const result = await service.updateKRWeight(goalUuid, krUuid, newWeight, reason);
      return result;
    } catch (error) {
      console.error('更新权重失败:', error);
      throw error;
    }
  };

  // ===== 快照查询 =====

  /**
   * 查询 Goal 的所有权重快照
   *
   * @param goalUuid - Goal UUID
   * @param page - 页码（从 1 开始）
   * @param pageSize - 每页数量（默认 20）
   */
  const fetchGoalSnapshots = async (goalUuid: string, page: number = 1, pageSize: number = 20) => {
    try {
      const result = await service.getGoalSnapshots(goalUuid, page, pageSize);
      snapshots.value = result.snapshots;
      pagination.total = result.pagination.total;
      pagination.page = result.pagination.page;
      pagination.pageSize = result.pagination.pageSize;
      pagination.totalPages = result.pagination.totalPages;
      return result;
    } catch (error) {
      console.error('查询 Goal 快照失败:', error);
      throw error;
    }
  };

  /**
   * 查询 KeyResult 的权重快照历史
   *
   * @param krUuid - KeyResult UUID
   * @param page - 页码
   * @param pageSize - 每页数量
   */
  const fetchKRSnapshots = async (krUuid: string, page: number = 1, pageSize: number = 20) => {
    try {
      const result = await service.getKRSnapshots(krUuid, page, pageSize);
      snapshots.value = result.snapshots;
      pagination.total = result.pagination.total;
      pagination.page = result.pagination.page;
      pagination.pageSize = result.pagination.pageSize;
      pagination.totalPages = result.pagination.totalPages;
      return result;
    } catch (error) {
      console.error('查询 KR 快照历史失败:', error);
      throw error;
    }
  };

  // ===== 数据可视化 =====

  /**
   * 获取权重趋势数据（用于 ECharts 图表）
   *
   * @param goalUuid - Goal UUID
   * @param startTime - 开始时间戳（毫秒）
   * @param endTime - 结束时间戳（毫秒）
   *
   * @example
   * ```typescript
   * // 获取最近 30 天的趋势
   * const now = Date.now();
   * const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
   * await fetchWeightTrend('goal-123', thirtyDaysAgo, now);
   * ```
   */
  const fetchWeightTrend = async (goalUuid: string, startTime: number, endTime: number) => {
    try {
      const result = await service.getWeightTrend(goalUuid, startTime, endTime);
      trendData.value = result;
      return result;
    } catch (error) {
      console.error('获取权重趋势失败:', error);
      throw error;
    }
  };

  /**
   * 对比多个时间点的权重分配
   *
   * @param goalUuid - Goal UUID
   * @param timePoints - 时间点数组（最多 5 个）
   *
   * @example
   * ```typescript
   * // 对比 60天前、30天前、现在
   * const now = Date.now();
   * await fetchWeightComparison('goal-123', [
   *   now - 60 * 24 * 60 * 60 * 1000,
   *   now - 30 * 24 * 60 * 60 * 1000,
   *   now,
   * ]);
   * ```
   */
  const fetchWeightComparison = async (goalUuid: string, timePoints: number[]) => {
    try {
      const result = await service.getWeightComparison(goalUuid, timePoints);
      comparisonData.value = result;
      return result;
    } catch (error) {
      console.error('获取权重对比失败:', error);
      throw error;
    }
  };

  // ===== 辅助方法 =====

  /**
   * 重置快照列表
   */
  const resetSnapshots = () => {
    snapshots.value = [];
    pagination.total = 0;
    pagination.page = 1;
    pagination.pageSize = 20;
    pagination.totalPages = 0;
  };

  /**
   * 重置趋势数据
   */
  const resetTrendData = () => {
    trendData.value = null;
  };

  /**
   * 重置对比数据
   */
  const resetComparisonData = () => {
    comparisonData.value = null;
  };

  /**
   * 重置所有状态
   */
  const reset = () => {
    resetSnapshots();
    resetTrendData();
    resetComparisonData();
  };

  // ===== 计算属性 =====

  /**
   * 是否有快照数据
   */
  const hasSnapshots = computed(() => snapshots.value.length > 0);

  /**
   * 是否有趋势数据
   */
  const hasTrendData = computed(() => trendData.value !== null);

  /**
   * 是否有对比数据
   */
  const hasComparisonData = computed(() => comparisonData.value !== null);

  /**
   * 是否有更多页
   */
  const hasMorePages = computed(() => pagination.page < pagination.totalPages);

  return {
    // 状态
    isLoading,
    error,
    snapshots,
    pagination,
    trendData,
    comparisonData,

    // 方法
    updateWeight,
    fetchGoalSnapshots,
    fetchKRSnapshots,
    fetchWeightTrend,
    fetchWeightComparison,

    // 重置方法
    resetSnapshots,
    resetTrendData,
    resetComparisonData,
    reset,

    // 计算属性
    hasSnapshots,
    hasTrendData,
    hasComparisonData,
    hasMorePages,
  };
}
