/**
 * GoalReview Entity - Server Interface
 * 
 * 【同步支持】
 * - deletedAt: 软删除时间戳
 * - version: 乐观锁版本号
 * - updatedAt: 最后更新时间（增量同步）
 */
import type { ReviewType } from '../value-objects/review-type';
import type { KeyResultSnapshotDTO } from '../value-objects';
import type { DomainDate, PersistenceDate, TransferDate, GoalReviewId, GoalId } from '@/primitives';

export interface GoalReviewServerDTO {
  id: GoalReviewId;
  goalId: GoalId;
  type: ReviewType;
  rating: number;
  summary: string;
  achievements: string | null;
  challenges: string | null;
  improvements: string | null;
  keyResultSnapshots: KeyResultSnapshotDTO[];
  reviewedAt: TransferDate;
  version: number;
  createdAt: TransferDate;
  updatedAt: TransferDate;
  deletedAt: TransferDate | null;
}

/**
 * GoalReview Persistence DTO
 * 数据库存储格式
 */
export interface GoalReviewPersistenceDTO {
  id: GoalReviewId;
  goalId: GoalId;
  type: string; // ReviewType as string
  rating: number;
  summary: string;
  achievements: string | null;
  challenges: string | null;
  improvements: string | null;
  keyResultSnapshots: string; // JSON string (KeyResultSnapshotDTO[])
  reviewedAt: PersistenceDate;
  version: number;
  createdAt: PersistenceDate;
  updatedAt: PersistenceDate;
  deletedAt: PersistenceDate | null;
}
