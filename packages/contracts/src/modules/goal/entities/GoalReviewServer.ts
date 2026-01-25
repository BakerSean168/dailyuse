/**
 * GoalReview Entity - Server Interface
 */
import type { GoalReviewClientDTO } from './GoalReviewClient';
import type { ReviewType } from '../enums';
import type { KeyResultSnapshotServerDTO } from '../value-objects';

export interface GoalReviewServerDTO {
  uuid: string;
  goalUuid: string;
  type: ReviewType;
  rating: number;
  summary: string;
  achievements?: string | null;
  challenges?: string | null;
  improvements?: string | null;
  keyResultSnapshots: KeyResultSnapshotServerDTO[];
  reviewedAt: number;
  createdAt: number;
}

/**
 * GoalReview Persistence DTO
 * 注意：使用 camelCase 命名
 */
export interface GoalReviewPersistenceDTO {
  uuid: string;
  goalUuid: string;
  type: ReviewType;
  rating: number;
  summary: string;
  achievements?: string | null;
  challenges?: string | null;
  improvements?: string | null;
  keyResultSnapshots: string; // JSON string
  reviewedAt: number;
  createdAt: Date;
}

export interface GoalReviewServer {
  uuid: string;
  goalUuid: string;
  type: ReviewType;
  rating: number;
  summary: string;
  achievements?: string | null;
  challenges?: string | null;
  improvements?: string | null;
  keyResultSnapshots: KeyResultSnapshotServerDTO[];
  reviewedAt: number;
  createdAt: Date;

  updateRating(rating: number): void;
  updateSummary(summary: string): void;
  addAchievement(achievement: string): void;
  addChallenge(challenge: string): void;
  addImprovement(improvement: string): void;
  isHighQuality(): boolean;

  toServerDTO(): GoalReviewServerDTO;
  toClientDTO(): GoalReviewClientDTO;
  toPersistenceDTO(): GoalReviewPersistenceDTO;
}

export interface GoalReviewServerStatic {
  create(params: {
    goalUuid: string;
    type: ReviewType;
    rating: number;
    summary: string;
    achievements?: string;
    challenges?: string;
    improvements?: string;
    keyResultSnapshots?: KeyResultSnapshotServerDTO[];
    reviewedAt?: number;
  }): GoalReviewServer;
  fromServerDTO(dto: GoalReviewServerDTO): GoalReviewServer;
  fromPersistenceDTO(dto: GoalReviewPersistenceDTO): GoalReviewServer;
}
