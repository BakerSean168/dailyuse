/**
 * useGoalReview Hook
 *
 * 目标复盘管理 Hook - 处理复盘记录的 CRUD 操作
 *
 * EPIC-015 重构: 与 Store 集成，使用 Entity 类型
 * - 使用 useGoalStore 作为状态源
 * - 返回 Entity 类型（GoalReview）
 * - 移除内部 useState，统一使用 Store 状态
 */

import { useState, useCallback } from 'react';
import { useGoalStore } from '../stores/goalStore';
import { goalApplicationService } from '@dailyuse/goal/application-client';
import type { GoalReview } from '@dailyuse/goal/domain-client';
import type { CreateGoalReviewRequest, UpdateGoalReviewRequest } from '@dailyuse/contracts/goal';

// ===== Types =====

// 使用 contracts 类型别名，保持向后兼容
export type CreateReviewInput = CreateGoalReviewRequest;
export type UpdateReviewInput = UpdateGoalReviewRequest;

export interface UseGoalReviewReturn {
  // State from Store
  reviews: GoalReview[];
  loading: boolean;
  error: string | null;
  editingReview: GoalReview | null;

  // Query
  loadReviews: (goalUuid: string) => Promise<GoalReview[]>;

  // Mutations
  createReview: (goalUuid: string, data: CreateReviewInput) => Promise<GoalReview>;
  updateReview: (
    goalUuid: string,
    reviewUuid: string,
    data: UpdateReviewInput,
  ) => Promise<GoalReview>;
  deleteReview: (goalUuid: string, reviewUuid: string) => Promise<void>;

  // Editing State
  setEditingReview: (review: GoalReview | null) => void;

  // Utilities
  clearError: () => void;
  clearReviews: () => void;
}

// ===== Hook Implementation =====

export function useGoalReview(): UseGoalReviewReturn {
  // ===== Store State =====
  const loading = useGoalStore((state) => state.isLoading);
  const error = useGoalStore((state) => state.error);

  // ===== Store Actions =====
  const storeSetLoading = useGoalStore((state) => state.setLoading);
  const storeSetError = useGoalStore((state) => state.setError);

  // ===== Local State (reviews are goal-specific, not global) =====
  const [reviews, setReviews] = useState<GoalReview[]>([]);
  const [editingReview, setEditingReviewState] = useState<GoalReview | null>(null);

  // ===== Query =====

  const loadReviews = useCallback(
    async (goalUuid: string): Promise<GoalReview[]> => {
      storeSetLoading(true);
      storeSetError(null);

      try {
        const result = await goalApplicationService.getReviews(goalUuid);
        setReviews(result);
        storeSetLoading(false);
        return result;
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : '加载复盘记录失败';
        storeSetError(errorMessage);
        storeSetLoading(false);
        throw e;
      }
    },
    [storeSetLoading, storeSetError],
  );

  // ===== Mutations =====

  const createReview = useCallback(
    async (goalUuid: string, data: CreateReviewInput): Promise<GoalReview> => {
      storeSetLoading(true);
      storeSetError(null);

      try {
        const review = await goalApplicationService.createReview(goalUuid, data);
        setReviews((prev) => [...prev, review]);
        storeSetLoading(false);
        return review;
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : '创建复盘失败';
        storeSetError(errorMessage);
        storeSetLoading(false);
        throw e;
      }
    },
    [storeSetLoading, storeSetError],
  );

  const updateReview = useCallback(
    async (goalUuid: string, reviewUuid: string, data: UpdateReviewInput): Promise<GoalReview> => {
      storeSetLoading(true);
      storeSetError(null);

      try {
        const review = await goalApplicationService.updateReview(goalUuid, reviewUuid, data);
        setReviews((prev) => prev.map((r) => (r.uuid === reviewUuid ? review : r)));
        setEditingReviewState(null);
        storeSetLoading(false);
        return review;
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : '更新复盘失败';
        storeSetError(errorMessage);
        storeSetLoading(false);
        throw e;
      }
    },
    [storeSetLoading, storeSetError],
  );

  const deleteReview = useCallback(
    async (goalUuid: string, reviewUuid: string): Promise<void> => {
      storeSetLoading(true);
      storeSetError(null);

      try {
        await goalApplicationService.deleteReview(goalUuid, reviewUuid);
        setReviews((prev) => prev.filter((r) => r.uuid !== reviewUuid));
        storeSetLoading(false);
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : '删除复盘失败';
        storeSetError(errorMessage);
        storeSetLoading(false);
        throw e;
      }
    },
    [storeSetLoading, storeSetError],
  );

  // ===== Editing State =====

  const setEditingReview = useCallback((review: GoalReview | null) => {
    setEditingReviewState(review);
  }, []);

  // ===== Utilities =====

  const clearError = useCallback(() => {
    storeSetError(null);
  }, [storeSetError]);

  const clearReviews = useCallback(() => {
    setReviews([]);
  }, []);

  // ===== Return =====

  return {
    // State from Store
    reviews,
    loading,
    error,
    editingReview,

    // Query
    loadReviews,

    // Mutations
    createReview,
    updateReview,
    deleteReview,

    // Editing State
    setEditingReview,

    // Utilities
    clearError,
    clearReviews,
  };
}

export default useGoalReview;
