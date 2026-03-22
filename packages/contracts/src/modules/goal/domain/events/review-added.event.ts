import type { GoalServerDTO } from '../../aggregates';
import type { GoalReviewServerDTO } from '../../entities';

export interface ReviewAddedEvent {
  identityId: string;
  goal: GoalServerDTO;
  review: GoalReviewServerDTO;
}
