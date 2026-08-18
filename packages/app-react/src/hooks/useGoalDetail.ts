import { useEffect, useState } from 'react';

import { presentErrorMessage } from '@memoflow/http-client';

import { useAppSession } from './useAppSession';
import { mapGoalDetail, type GoalDetail } from './useGoals';
import { useGoalService } from './useGoalService';

export function useGoalDetail(goalId: string | null) {
  const service = useGoalService();
  const { isRemoteAuthenticated } = useAppSession();

  const [goal, setGoal] = useState<GoalDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isRemoteAuthenticated || !goalId) {
      setGoal(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    const activeGoalId = goalId;

    async function loadGoal() {
      setIsLoading(true);
      setError(null);

      const goalResult = await service.getGoalAggregateView(activeGoalId);

      if (cancelled) {
        return;
      }

      if (!goalResult.ok) {
        setGoal(null);
        setError(presentErrorMessage(goalResult.error));
        setIsLoading(false);
        return;
      }

      setGoal(mapGoalDetail(goalResult.data.goal));
      setIsLoading(false);
    }

    void loadGoal();

    return () => {
      cancelled = true;
    };
  }, [goalId, isRemoteAuthenticated, service]);

  async function refresh() {
    if (!isRemoteAuthenticated || !goalId) {
      return;
    }

    setIsLoading(true);
    const goalResult = await service.getGoalAggregateView(goalId);

    if (!goalResult.ok) {
      setGoal(null);
      setError(presentErrorMessage(goalResult.error));
      setIsLoading(false);
      return;
    }

    setGoal(mapGoalDetail(goalResult.data.goal));
    setError(null);
    setIsLoading(false);
  }

  return {
    error,
    goal,
    isLoading,
    refresh,
  };
}
