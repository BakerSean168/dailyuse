/**
 * useTaskStatistics Hook
 *
 * 任务统计 Hook
 */

import { useState, useCallback } from 'react';
import { taskApplicationService } from '@dailyuse/application-client/task';
import type { GetTaskStatisticsRequest } from '@dailyuse/contracts/task';

// ===== Types =====

export interface TaskStatisticsState {
  statistics: unknown | null;
  todayRate: number;
  weekRate: number;
  efficiencyTrend: unknown;
  loading: boolean;
  error: string | null;
}

export interface UseTaskStatisticsReturn extends TaskStatisticsState {
  loadStatistics: (input: GetTaskStatisticsRequest) => Promise<void>;
  loadTodayRate: (accountUuid: string) => Promise<void>;
  loadWeekRate: (accountUuid: string) => Promise<void>;
  loadEfficiencyTrend: (accountUuid: string) => Promise<void>;
  clearError: () => void;
}

// ===== Hook Implementation =====

export function useTaskStatistics(): UseTaskStatisticsReturn {
  const [state, setState] = useState<TaskStatisticsState>({
    statistics: null,
    todayRate: 0,
    weekRate: 0,
    efficiencyTrend: null,
    loading: false,
    error: null,
  });

  const loadStatistics = useCallback(async (input: GetTaskStatisticsRequest) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const statistics = await taskApplicationService.getStatistics(input);
      setState((prev) => ({ ...prev, statistics, loading: false }));
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : '加载任务统计失败';
      setState((prev) => ({ ...prev, loading: false, error: errorMessage }));
    }
  }, []);

  const loadTodayRate = useCallback(async (accountUuid: string) => {
    try {
      const todayRate = await taskApplicationService.getTodayCompletionRate(accountUuid);
      setState((prev) => ({ ...prev, todayRate }));
    } catch (e) {
      console.error('Failed to load today rate:', e);
    }
  }, []);

  const loadWeekRate = useCallback(async (accountUuid: string) => {
    try {
      const weekRate = await taskApplicationService.getWeekCompletionRate(accountUuid);
      setState((prev) => ({ ...prev, weekRate }));
    } catch (e) {
      console.error('Failed to load week rate:', e);
    }
  }, []);

  const loadEfficiencyTrend = useCallback(async (accountUuid: string) => {
    try {
      const efficiencyTrend = await taskApplicationService.getEfficiencyTrend(accountUuid);
      setState((prev) => ({ ...prev, efficiencyTrend }));
    } catch (e) {
      console.error('Failed to load efficiency trend:', e);
    }
  }, []);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  return {
    statistics: state.statistics,
    todayRate: state.todayRate,
    weekRate: state.weekRate,
    efficiencyTrend: state.efficiencyTrend,
    loading: state.loading,
    error: state.error,
    loadStatistics,
    loadTodayRate,
    loadWeekRate,
    loadEfficiencyTrend,
    clearError,
  };
}

export default useTaskStatistics;
