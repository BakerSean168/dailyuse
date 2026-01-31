/**
 * GoalReview Entity - Server Interface
 */
import type { GoalReviewClientDTO } from './goal-review-client';
import type { ReviewType } from '../value-objects/review-type';
import type { KeyResultSnapshotDTO } from '../value-objects';
import type { DomainDate, PersistenceDate, TransferDate } from '@/primitives';

export interface GoalReviewServerDTO {
  uuid: string;
  goalUuid: string;
  type: ReviewType;
  rating: number;
  summary: string;
  achievements: string | null;
  challenges: string | null;
  improvements: string | null;
  keyResultSnapshots: KeyResultSnapshotDTO[];
  reviewedAt: TransferDate;
  createdAt: TransferDate;
}

/**
 * GoalReview Persistence DTO
 * 注意：使用 camelCase 命名
 */
export interface GoalReviewPersistenceDTO {
  id: string;
  type: ReviewType;
  rating: number;
  summary: string;
  achievements: string | null;
  challenges: string | null;
  improvements: string | null;
  keyResultSnapshots: string; // JSON string
  reviewedAt: PersistenceDate;
  createdAt: PersistenceDate;
}

export interface GoalReviewServer {
  id: string;
  type: ReviewType;
  rating: number;
  summary: string;
  achievements: string | null;
  challenges: string | null;
  improvements: string | null;
  keyResultSnapshots: KeyResultSnapshotDTO[];
  reviewedAt: DomainDate;
  createdAt: DomainDate;
}
