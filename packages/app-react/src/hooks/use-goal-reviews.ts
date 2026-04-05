import { useEffect, useState } from 'react';

import type { GoalReviewClientDTO } from '@dailyuse/contracts/goal';
import type { GoalReview } from '@dailyuse/goal/domain-client';

import { useAppSession } from './use-app-session';
import { useGoalService } from './use-goal-service';

export type GoalReviewSummary = {
  id: string;
  goalId: string;
  type: string;
  rating: number;
  summary: string;
  achievements: string | null;
  challenges: string | null;
  improvements: string | null;
  reviewedAt: number;
  createdAt: number;
};

function mapReview(review: GoalReviewClientDTO): GoalReviewSummary {
  return {
    id: String(review.id),
    goalId: String(review.goalId),
    type: review.type,
    rating: review.rating,
    summary: review.summary,
    achievements: review.achievements,
    challenges: review.challenges,
    improvements: review.improvements,
    reviewedAt: review.reviewedAt,
    createdAt: review.createdAt,
  };
}

export function useGoalReviews(goalId: string | null) {
  const service = useGoalService();
  const { isRemoteAuthenticated } = useAppSession();
  const [reviews, setReviews] = useState<GoalReviewSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    if (!isRemoteAuthenticated || !goalId) {
      setReviews([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    const result = await service.getGoalReviews(goalId);
    if (!result.ok) {
      setReviews([]);
      setError(result.error.message);
      setIsLoading(false);
      return;
    }

    const mapped = result.data.reviews
      .map((review: GoalReview) => mapReview(review.toDTO()))
      .sort((left: GoalReviewSummary, right: GoalReviewSummary) => right.reviewedAt - left.reviewedAt);
    setReviews(mapped);
    setIsLoading(false);
  }

  useEffect(() => {
    void load();
  }, [goalId, isRemoteAuthenticated]);

  async function refresh() {
    await load();
  }

  return {
    error,
    isLoading,
    refresh,
    reviews,
  };
}
