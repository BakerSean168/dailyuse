/**
 * useKeyResult Hook
 *
 * 关键结果管理 Hook - 处理关键结果的 CRUD 操作
 *
 * EPIC-015 重构: 与 Store 集成，使用 Entity 类型
 * - 使用 useGoalStore 作为状态源
 * - 返回 Entity 类型（KeyResult, GoalRecord）
 * - 移除内部 useState，统一使用 Store 状态
 */

import { useState, useCallback } from 'react';
import { useGoalStore } from '../stores/goalStore';
import { goalApplicationService } from '@dailyuse/goal/application-client';
import type { KeyResult, GoalRecord } from '@dailyuse/goal/domain-client';
import type {
  AddKeyResultRequest,
  UpdateKeyResultRequest,
  CreateGoalRecordRequest,
} from '@dailyuse/contracts/goal';
import { KeyResultValueType, KeyResultCalculationMethod as AggregationMethod } from '@dailyuse/contracts/goal';

// ===== Types =====

// 使用 contracts 类型别名，保持向后兼容
export type CreateKeyResultInput = AddKeyResultRequest;
export type UpdateKeyResultInput = UpdateKeyResultRequest;
export type CreateRecordInput = CreateGoalRecordRequest;

export interface UseKeyResultReturn {
  // State from Store
  loading: boolean;
  error: string | null;
  editingKeyResult: KeyResult | null;

  // CRUD Operations
  createKeyResult: (goalId: string, data: CreateKeyResultInput) => Promise<KeyResult>;
  updateKeyResult: (
    goalId: string,
    keyResultId: string,
    data: UpdateKeyResultInput,
  ) => Promise<KeyResult>;
  deleteKeyResult: (goalId: string, keyResultId: string) => Promise<void>;

  // Record Operations
  createRecord: (
    goalId: string,
    keyResultId: string,
    data: CreateRecordInput,
  ) => Promise<GoalRecord>;
  deleteRecord: (goalId: string, keyResultId: string, recordId: string) => Promise<void>;

  // Editing State
  setEditingKeyResult: (keyResult: KeyResult | null) => void;

  // Utilities
  clearError: () => void;
}

// ===== Hook Implementation =====

export function useKeyResult(): UseKeyResultReturn {
  // ===== Store State =====
  const loading = useGoalStore((state) => state.isLoading);
  const error = useGoalStore((state) => state.error);

  // ===== Store Actions =====
  const storeSetLoading = useGoalStore((state) => state.setLoading);
  const storeSetError = useGoalStore((state) => state.setError);

  // ===== Local Editing State (不需要全局共享) =====
  const [editingKeyResult, setEditingKeyResultState] = useState<KeyResult | null>(null);

  // ===== CRUD Operations =====

  const createKeyResult = useCallback(
    async (goalId: string, data: CreateKeyResultInput): Promise<KeyResult> => {
      storeSetLoading(true);
      storeSetError(null);

      try {
        const request = {
          title: data.title,
          description: data.description,
          targetValue: data.targetValue,
          currentValue: data.currentValue ?? 0,
          unit: data.unit,
          weight: data.weight,
          valueType: data.valueType ?? KeyResultValueType.INCREMENTAL,
          aggregationMethod: data.aggregationMethod ?? AggregationMethod.SUM,
        };

        const result = await goalApplicationService.createKeyResult(goalId, request);
        storeSetLoading(false);
        return result;
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : '创建关键结果失败';
        storeSetError(errorMessage);
        storeSetLoading(false);
        throw e;
      }
    },
    [storeSetLoading, storeSetError],
  );

  const updateKeyResult = useCallback(
    async (
      goalId: string,
      keyResultId: string,
      data: UpdateKeyResultInput,
    ): Promise<KeyResult> => {
      storeSetLoading(true);
      storeSetError(null);

      try {
        const result = await goalApplicationService.updateKeyResult(goalId, keyResultId, data);
        setEditingKeyResultState(null);
        storeSetLoading(false);
        return result;
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : '更新关键结果失败';
        storeSetError(errorMessage);
        storeSetLoading(false);
        throw e;
      }
    },
    [storeSetLoading, storeSetError],
  );

  const deleteKeyResult = useCallback(
    async (goalId: string, keyResultId: string): Promise<void> => {
      storeSetLoading(true);
      storeSetError(null);

      try {
        await goalApplicationService.deleteKeyResult(goalId, keyResultId);
        storeSetLoading(false);
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : '删除关键结果失败';
        storeSetError(errorMessage);
        storeSetLoading(false);
        throw e;
      }
    },
    [storeSetLoading, storeSetError],
  );

  // ===== Record Operations =====

  const createRecord = useCallback(
    async (
      goalId: string,
      keyResultId: string,
      data: CreateRecordInput,
    ): Promise<GoalRecord> => {
      storeSetLoading(true);
      storeSetError(null);

      try {
        const request = {
          value: data.value,
          note: data.note,
          recordedAt: data.recordedAt ?? Date.now(),
        };

        const result = await goalApplicationService.createRecord(goalId, keyResultId, request);
        storeSetLoading(false);
        return result;
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : '创建记录失败';
        storeSetError(errorMessage);
        storeSetLoading(false);
        throw e;
      }
    },
    [storeSetLoading, storeSetError],
  );

  const deleteRecord = useCallback(
    async (goalId: string, keyResultId: string, recordId: string): Promise<void> => {
      storeSetLoading(true);
      storeSetError(null);

      try {
        await goalApplicationService.deleteRecord(goalId, keyResultId, recordId);
        storeSetLoading(false);
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : '删除记录失败';
        storeSetError(errorMessage);
        storeSetLoading(false);
        throw e;
      }
    },
    [storeSetLoading, storeSetError],
  );

  // ===== Editing State =====

  const setEditingKeyResult = useCallback((keyResult: KeyResult | null) => {
    setEditingKeyResultState(keyResult);
  }, []);

  // ===== Utilities =====

  const clearError = useCallback(() => {
    storeSetError(null);
  }, [storeSetError]);

  // ===== Return =====

  return {
    // State from Store
    loading,
    error,
    editingKeyResult,

    // CRUD Operations
    createKeyResult,
    updateKeyResult,
    deleteKeyResult,

    // Record Operations
    createRecord,
    deleteRecord,

    // Editing State
    setEditingKeyResult,

    // Utilities
    clearError,
  };
}

export default useKeyResult;
