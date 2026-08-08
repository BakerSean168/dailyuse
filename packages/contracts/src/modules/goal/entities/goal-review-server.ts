/**
 * GoalReview Entity - Server Interface
 * 
 * 并发版本和删除生命周期由 Goal 聚合根统一管理。
 */
import type { ReviewType } from '../value-objects/review-type';
import type { KeyResultSnapshotDTO } from '../value-objects';
import type { TransferDate, GoalReviewId, GoalId } from '../../../primitives';

export interface GoalReviewServerDTO {
  id: GoalReviewId;
  goalId: GoalId;
  type: ReviewType;
  title: string | null;
  rating: number;
  summary: string;
  achievements: string | null;
  challenges: string | null;
  improvements: string | null;
  keyResultSnapshots: KeyResultSnapshotDTO[];
  reviewedAt: TransferDate;
  createdAt: TransferDate;
  updatedAt: TransferDate;
}
