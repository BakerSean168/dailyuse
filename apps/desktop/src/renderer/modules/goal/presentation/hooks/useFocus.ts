/**
 * useFocus Hook
 *
 * 专注功能的 React Hook
 * 封装 FocusApplicationService 调用和 Store 状态管理
 *
 * EPIC-018: 遵循 Store → Hooks → ApplicationService → packages 架构
 */

import { useCallback } from 'react';
import { useFocusStore } from '../stores/focusStore';
import { goalApplicationService } from '@dailyuse/goal/application-client';
import type {
  FocusSessionClientDTO,
  FocusStatusDTO,
  FocusHistoryDTO,
} from '@dailyuse/contracts/goal';

// ===== Types =====

export interface UseFocusReturn {
  // State from Store
  currentSession: FocusSessionClientDTO | null;
  isActive: boolean;
  isPaused: boolean;
  remainingTime: number | null;
  todayHistory: FocusHistoryDTO | null;
  weekHistory: FocusHistoryDTO | null;
  loading: boolean;
  error: string | null;

  // Configuration
  defaultDuration: number;

  // Actions
  startFocus: (goalUuid: string, duration?: number) => Promise<FocusSessionClientDTO>;
  pauseFocus: () => Promise<void>;
  resumeFocus: () => Promise<void>;
  stopFocus: (notes?: string) => Promise<FocusSessionClientDTO | null>;
  refreshStatus: () => Promise<void>;
  fetchTodayHistory: (goalUuid?: string) => Promise<void>;
  fetchWeekHistory: (goalUuid?: string) => Promise<void>;

  // Utilities
  clearError: () => void;
}

// ===== Hook Implementation =====

export function useFocus(): UseFocusReturn {
  // ===== Store State (只订阅数据，不订阅 actions) =====
  const currentSession = useFocusStore((s) => s.currentSession);
  const isActive = useFocusStore((s) => s.isActive);
  const isPaused = useFocusStore((s) => s.isPaused);
  const remainingTime = useFocusStore((s) => s.remainingTime);
  const todayHistory = useFocusStore((s) => s.todayHistory);
  const weekHistory = useFocusStore((s) => s.weekHistory);
  const loading = useFocusStore((s) => s.isLoading);
  const error = useFocusStore((s) => s.error);
  const defaultDuration = useFocusStore((s) => s.defaultDuration);

  // ===== Query =====
  // 所有 useCallback 使用空依赖，在函数内部调用 getState() 获取最新 store

  // ===== Actions =====

  const startFocus = useCallback(
    async (goalUuid: string, duration?: number): Promise<FocusSessionClientDTO> => {
      const store = useFocusStore.getState();
      store.setLoading(true);
      store.setError(null);

      try {
        const session = await goalApplicationService.startFocusSession({
          goalUuid,
          durationMinutes: duration ?? store.defaultDuration,
        });

        store.setCurrentSession(session);
        store.setRemainingTime(session.durationMinutes * 60);

        return session;
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Failed to start focus';
        store.setError(message);
        throw e;
      } finally {
        store.setLoading(false);
      }
    },
    [],
  );

  const pauseFocus = useCallback(async (): Promise<void> => {
    const store = useFocusStore.getState();
    store.setLoading(true);

    try {
      const session = await goalApplicationService.pauseFocusSession();
      store.setCurrentSession(session);
    } catch (e) {
      store.setError(e instanceof Error ? e.message : 'Failed to pause focus');
      throw e;
    } finally {
      store.setLoading(false);
    }
  }, []);

  const resumeFocus = useCallback(async (): Promise<void> => {
    const store = useFocusStore.getState();
    store.setLoading(true);

    try {
      const session = await goalApplicationService.resumeFocusSession();
      store.setCurrentSession(session);
    } catch (e) {
      store.setError(e instanceof Error ? e.message : 'Failed to resume focus');
      throw e;
    } finally {
      store.setLoading(false);
    }
  }, []);

  const stopFocus = useCallback(async (notes?: string): Promise<FocusSessionClientDTO | null> => {
    const store = useFocusStore.getState();
    store.setLoading(true);

    try {
      const session = await goalApplicationService.stopFocusSession(notes);
      store.setCurrentSession(null);
      store.setRemainingTime(null);
      return session;
    } catch (e) {
      store.setError(e instanceof Error ? e.message : 'Failed to stop focus');
      throw e;
    } finally {
      store.setLoading(false);
    }
  }, []);

  const refreshStatus = useCallback(async (): Promise<void> => {
    const store = useFocusStore.getState();
    try {
      const status: FocusStatusDTO = await goalApplicationService.getFocusStatus();

      if (status.session) {
        store.setCurrentSession(status.session);
        if (status.remainingSeconds !== undefined) {
          store.setRemainingTime(status.remainingSeconds);
        }
      } else {
        store.setCurrentSession(null);
        store.setRemainingTime(null);
      }
    } catch (e) {
      store.setError(e instanceof Error ? e.message : 'Failed to refresh status');
    }
  }, []);

  const fetchTodayHistory = useCallback(async (goalUuid?: string): Promise<void> => {
    const store = useFocusStore.getState();
    try {
      const history = await goalApplicationService.getFocusHistory({ range: 'today', goalUuid });
      store.setTodayHistory(history);
    } catch (e) {
      store.setError(e instanceof Error ? e.message : 'Failed to fetch today history');
    }
  }, []);

  const fetchWeekHistory = useCallback(async (goalUuid?: string): Promise<void> => {
    const store = useFocusStore.getState();
    try {
      const history = await goalApplicationService.getFocusHistory({ range: 'week', goalUuid });
      store.setWeekHistory(history);
    } catch (e) {
      store.setError(e instanceof Error ? e.message : 'Failed to fetch week history');
    }
  }, []);

  const clearError = useCallback(() => {
    const store = useFocusStore.getState();
    store.setError(null);
  }, []);

  return {
    // State
    currentSession,
    isActive,
    isPaused,
    remainingTime,
    todayHistory,
    weekHistory,
    loading,
    error,
    defaultDuration,

    // Actions
    startFocus,
    pauseFocus,
    resumeFocus,
    stopFocus,
    refreshStatus,
    fetchTodayHistory,
    fetchWeekHistory,

    // Utilities
    clearError,
  };
}
