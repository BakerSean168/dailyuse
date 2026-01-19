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
import { goalApplicationService } from '@dailyuse/application-client/goal';
import type { KeyResult, GoalRecord } from '@dailyuse/domain-client/goal';
import type {
  AddKeyResultRequest,
  UpdateKeyResultRequest,
  CreateGoalRecordRequest,
} from '@dailyuse/contracts/goal';
import { KeyResultValueType, AggregationMethod } from '@dailyuse/contracts/goal';

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
  createKeyResult: (goalUuid: string, data: CreateKeyResultInput) => Promise<KeyResult>;
  updateKeyResult: (
    goalUuid: string,
    keyResultUuid: string,
    data: UpdateKeyResultInput,
  ) => Promise<KeyResult>;
  deleteKeyResult: (goalUuid: string, keyResultUuid: string) => Promise<void>;

  // Record Operations
  createRecord: (
    goalUuid: string,
    keyResultUuid: string,
    data: CreateRecordInput,
  ) => Promise<GoalRecord>;
  deleteRecord: (goalUuid: string, keyResultUuid: string, recordUuid: string) => Promise<void>;

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
    async (goalUuid: string, data: CreateKeyResultInput): Promise<KeyResult> => {
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

        const result = await goalApplicationService.createKeyResult(goalUuid, request);
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
      goalUuid: string,
      keyResultUuid: string,
      data: UpdateKeyResultInput,
    ): Promise<KeyResult> => {
      storeSetLoading(true);
      storeSetError(null);

      try {
        const result = await goalApplicationService.updateKeyResult(goalUuid, keyResultUuid, data);
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
    async (goalUuid: string, keyResultUuid: string): Promise<void> => {
      storeSetLoading(true);
      storeSetError(null);

      try {
        await goalApplicationService.deleteKeyResult(goalUuid, keyResultUuid);
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
      goalUuid: string,
      keyResultUuid: string,
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

        const result = await goalApplicationService.createRecord(goalUuid, keyResultUuid, request);
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
    async (goalUuid: string, keyResultUuid: string, recordUuid: string): Promise<void> => {
      storeSetLoading(true);
      storeSetError(null);

      try {
        await goalApplicationService.deleteRecord(goalUuid, keyResultUuid, recordUuid);
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
