import type { GoalServerDTO } from '../../aggregates/goal-server';
import type { GoalReviewServerDTO } from '../../entities/goal-review-server';

export interface ReviewAddedEvent {
  identityId: string;
  goal: GoalServerDTO;
  review: GoalReviewServerDTO;
}
