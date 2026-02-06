/**
 * GoalReview Entity - Client Interface
 */

import type { DomainDate, TransferDate, GoalReviewId, GoalId } from '@/primitives';
import type { ReviewType } from '../value-objects/review-type';
import type { KeyResultSnapshot, KeyResultSnapshotDTO } from '../value-objects';

export interface GoalReviewClientDTO {
  id: GoalReviewId;
  goalId: GoalId;
  type: ReviewType;
  rating: number;
  summary: string;
  achievements: string | null;
  challenges: string | null;
  improvements: string | null;
  keyResultSnapshots: KeyResultSnapshotDTO[];
  version: number;
  reviewedAt: TransferDate;
  createdAt: TransferDate;
  updatedAt: TransferDate;
  deletedAt: TransferDate | null;
}

export interface GoalReviewClient {
  id: GoalReviewId;
  goalId: GoalId;
  type: ReviewType;
  rating: number;
  summary: string;
  achievements: string | null;
  challenges: string | null;
  improvements: string | null;
  keyResultSnapshots: KeyResultSnapshot[];
  version: number;
  reviewedAt: DomainDate;
  createdAt: DomainDate;
  updatedAt: DomainDate;
  deletedAt: DomainDate | null;
}
