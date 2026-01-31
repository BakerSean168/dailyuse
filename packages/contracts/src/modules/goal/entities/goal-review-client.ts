/**
 * GoalReview Entity - Client Interface
 */

import type { ReviewType } from '../value-objects/review-type';
import type { GoalReviewServerDTO } from './goal-review-server';
import type { KeyResultSnapshotDTO } from '../value-objects';

export interface GoalReviewClientDTO {
  uuid: string;
  goalUuid: string;
  type: ReviewType;
  rating: number;
  summary: string;
  achievements: string | null;
  challenges: string | null;
  improvements: string | null;
  keyResultSnapshots: KeyResultSnapshotDTO[];
  reviewedAt: number;
  createdAt: number;
}

export interface GoalReviewClient {
  uuid: string;
  goalUuid: string;
  type: ReviewType;
  rating: number;
  summary: string;
  achievements: string | null;
  challenges: string | null;
  improvements: string | null;
  keyResultSnapshots: KeyResultSnapshotDTO[];
  reviewedAt: number;
  createdAt: Date;
}
