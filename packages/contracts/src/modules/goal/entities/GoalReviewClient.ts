/**
 * GoalReview Entity - Client Interface
 */

import type { ReviewType } from '../enums';
import type { GoalReviewServerDTO } from './GoalReviewServer';
import type { KeyResultSnapshotClientDTO } from '../value-objects';

export interface GoalReviewClientDTO {
  uuid: string;
  goalUuid: string;
  type: ReviewType;
  rating: number;
  summary: string;
  achievements?: string | null;
  challenges?: string | null;
  improvements?: string | null;
  keyResultSnapshots: KeyResultSnapshotClientDTO[];
  reviewedAt: number;
  createdAt: number;
}

export interface GoalReviewClient {
  uuid: string;
  goalUuid: string;
  type: ReviewType;
  rating: number;
  summary: string;
  achievements?: string | null;
  challenges?: string | null;
  improvements?: string | null;
  keyResultSnapshots: KeyResultSnapshotClientDTO[];
  reviewedAt: number;
  createdAt: number;

  toClientDTO(): GoalReviewClientDTO;
  toServerDTO(): GoalReviewServerDTO;
}

export interface GoalReviewClientStatic {
  fromClientDTO(dto: GoalReviewClientDTO): GoalReviewClient;
  fromServerDTO(dto: GoalReviewServerDTO): GoalReviewClient;
  forCreate(goalUuid: string): GoalReviewClient;
}

export interface GoalReviewClientInstance extends GoalReviewClient {
  clone(): GoalReviewClient;
}
