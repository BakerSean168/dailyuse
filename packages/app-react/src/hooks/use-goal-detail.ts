import { useEffect, useState } from 'react';

import type { KeyResult } from '@dailyuse/goal/domain-client';

import { useAppSession } from './use-app-session';
import { mapGoalDetail, type GoalDetail } from './use-goals';
import { useGoalService } from './use-goal-service';

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

      const [goalResult, keyResultResult, reviewResult] = await Promise.all([
        service.getGoal(activeGoalId),
        service.getKeyResults(activeGoalId),
        service.getGoalReviews(activeGoalId),
      ]);

      if (cancelled) {
        return;
      }

      if (!goalResult.ok) {
        setGoal(null);
        setError(goalResult.error.message);
        setIsLoading(false);
        return;
      }

      if (!keyResultResult.ok) {
        setGoal(null);
        setError(keyResultResult.error.message);
        setIsLoading(false);
        return;
      }

      if (!reviewResult.ok) {
        setGoal(null);
        setError(reviewResult.error.message);
        setIsLoading(false);
        return;
      }

      setGoal(
        mapGoalDetail(
          goalResult.data,
          keyResultResult.data.keyResults.map((item: KeyResult) => item.toDTO()),
          reviewResult.data.reviews.length,
        ),
      );
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
    const [goalResult, keyResultResult, reviewResult] = await Promise.all([
      service.getGoal(goalId),
      service.getKeyResults(goalId),
      service.getGoalReviews(goalId),
    ]);

    if (!goalResult.ok) {
      setGoal(null);
      setError(goalResult.error.message);
      setIsLoading(false);
      return;
    }

    if (!keyResultResult.ok) {
      setGoal(null);
      setError(keyResultResult.error.message);
      setIsLoading(false);
      return;
    }

    if (!reviewResult.ok) {
      setGoal(null);
      setError(reviewResult.error.message);
      setIsLoading(false);
      return;
    }

    setGoal(
      mapGoalDetail(
        goalResult.data,
        keyResultResult.data.keyResults.map((item: KeyResult) => item.toDTO()),
        reviewResult.data.reviews.length,
      ),
    );
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
