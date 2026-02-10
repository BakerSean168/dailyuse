/**
 * Key Result Composable
 * 关键结果相关的业务逻辑
 *
 * 🔄 重构说明（方案 A - 简化版）：
 * - Composable 负责协调 ApplicationService 和 Store
 * - Service 直接返回 DTO 或抛出错误
 * - Composable 使用 try/catch 处理错误 + 显示通知
 * - KeyResult 操作会触发事件，由 GoalSyncService 自动刷新 Goal
 */

import { ref, computed, readonly } from 'vue';
import { AggregationMethod, KeyResultValueType } from '@dailyuse/contracts/goal';
import type {
  KeyResultClientDTO,
  AddKeyResultRequest,
  UpdateKeyResultRequest,
} from '@dailyuse/contracts/goal';
import {
  CreateKeyResult,
  GetKeyResults,
  UpdateKeyResult,
  DeleteKeyResult,
  BatchUpdateKeyResultWeights,
  GetProgressBreakdown,
} from '@dailyuse/goal/application-client';
import { getGoalStore } from '../stores/goalStore';
import { getGlobalMessage } from '@dailyuse/ui-vuetify';

export function useKeyResult() {
  const goalStore = getGoalStore();
  const { success: showSuccess, error: showError } = getGlobalMessage();

  // ===== 本地状态 =====
  const isOperating = ref(false);
  const operationError = ref<string | null>(null);
  const showCreateKeyResultDialog = ref(false);
  const showEditKeyResultDialog = ref(false);
  const editingKeyResult = ref<KeyResultClientDTO | null>(null);
  const currentGoalUuid = ref<string | null>(null);

  // ===== 计算属性 =====
  const isLoading = computed(() => goalStore.isLoading || isOperating.value);
  const error = computed(() => goalStore.error || operationError.value);

  // ===== CRUD 操作 =====

  /**
   * 获取目标的关键结果列表
   */
  const fetchKeyResultsByGoal = async (goalUuid: string) => {
    try {
      isOperating.value = true;
      operationError.value = null;

      const result = await new GetKeyResults().execute({ goalUuid });
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取关键结果列表失败';
      operationError.value = errorMessage;
      showError(errorMessage);
      throw err;
    } finally {
      isOperating.value = false;
    }
  };

  /**
   * 创建关键结果
   * 接受用户友好的参数，内部转换为 AddKeyResultRequest
   */
  const createKeyResult = async (
    goalUuid: string,
    data: {
      title: string;
      description?: string;
      targetValue: number;
      currentValue?: number;
      unit?: string;
      weight: number;
      valueType?: KeyResultValueType;
      aggregationMethod?: AggregationMethod;
    },
  ) => {
    try {
      isOperating.value = true;
      operationError.value = null;

      // 构建符合 AddKeyResultRequest 的请求
      const request: Omit<AddKeyResultRequest, 'goalUuid'> = {
        title: data.title,
        description: data.description,
        valueType: data.valueType || KeyResultValueType.INCREMENTAL,
        aggregationMethod: data.aggregationMethod || AggregationMethod.LAST,
        targetValue: data.targetValue,
        currentValue: data.currentValue,
        unit: data.unit,
        weight: data.weight,
      };

      // ✅ Service 返回 DTO，事件驱动刷新 Goal
      const response = await new CreateKeyResult().execute({
        ...request,
        goalUuid,
      });

      showCreateKeyResultDialog.value = false;
      showSuccess('关键结果创建成功');

      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '创建关键结果失败';
      operationError.value = errorMessage;
      showError(errorMessage);
      throw err;
    } finally {
      isOperating.value = false;
    }
  };

  /**
   * 更新关键结果
   */
  const updateKeyResult = async (
    goalUuid: string,
    keyResultUuid: string,
    data: UpdateKeyResultRequest,
  ) => {
    try {
      isOperating.value = true;
      operationError.value = null;

      // ✅ Service 返回 DTO，事件驱动刷新 Goal
      const response = await new UpdateKeyResult().execute(keyResultUuid, data);

      showEditKeyResultDialog.value = false;
      editingKeyResult.value = null;
      showSuccess('关键结果更新成功');

      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '更新关键结果失败';
      operationError.value = errorMessage;
      showError(errorMessage);
      throw err;
    } finally {
      isOperating.value = false;
    }
  };

  /**
   * 删除关键结果
   */
  const deleteKeyResult = async (goalUuid: string, keyResultUuid: string) => {
    try {
      isOperating.value = true;
      operationError.value = null;

      // ✅ Service 返回 void，事件驱动刷新 Goal
      await new DeleteKeyResult().execute(keyResultUuid);

      showSuccess('关键结果删除成功');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '删除关键结果失败';
      operationError.value = errorMessage;
      showError(errorMessage);
      throw err;
    } finally {
      isOperating.value = false;
    }
  };

  /**
   * 批量更新关键结果权重
   */
  const batchUpdateWeights = async (
    goalUuid: string,
    updates: Array<{ keyResultUuid: string; weight: number }>,
  ) => {
    try {
      isOperating.value = true;
      operationError.value = null;

      const response = await new BatchUpdateKeyResultWeights().execute(goalUuid, {
        updates,
      });

      showSuccess('权重更新成功');
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '批量更新权重失败';
      operationError.value = errorMessage;
      showError(errorMessage);
      throw err;
    } finally {
      isOperating.value = false;
    }
  };

  /**
   * 获取进度分解详情
   */
  const fetchProgressBreakdown = async (goalUuid: string) => {
    try {
      isOperating.value = true;
      operationError.value = null;

      return await new GetProgressBreakdown().execute(goalUuid);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取进度详情失败';
      operationError.value = errorMessage;
      showError(errorMessage);
      throw err;
    } finally {
      isOperating.value = false;
    }
  };

  // ===== 工具方法 =====

  const clearError = () => {
    operationError.value = null;
  };

  return {
    // 状态
    isLoading: readonly(isLoading),
    error: readonly(error),
    showCreateKeyResultDialog,
    showEditKeyResultDialog,
    editingKeyResult,
    currentGoalUuid,

    // CRUD 方法
    fetchKeyResultsByGoal,
    createKeyResult,
    updateKeyResult,
    deleteKeyResult,

    // 额外方法
    batchUpdateWeights,
    fetchProgressBreakdown,

    // 工具方法
    clearError,
  };
}
