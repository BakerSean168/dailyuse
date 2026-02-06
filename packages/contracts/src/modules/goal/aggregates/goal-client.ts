/**
 * Goal Aggregate Root - Client Contracts
 */

import type { DomainDate, TransferDate, GoalId, IdentityId, GoalFolderId } from '@/primitives';
import type { ImportanceLevel } from '../../../shared/index';
import type { GoalStatus } from '../value-objects/goal-status';
import type { KeyResultClient, KeyResultClientDTO } from '../entities/key-result-client';
import type { GoalReviewClient, GoalReviewClientDTO } from '../entities/goal-review-client';
import type { GoalReminderConfig, GoalReminderConfigDTO } from '../value-objects';

// ============ Domain Shape ============

/**
 * Goal aggregate - Client Domain Shape
 */
export interface GoalClient {
  id: GoalId;
  identityId: IdentityId;

  name: string;
  description: string | null;
  color: string | null;

  feasibilityAnalysis: string | null;
  motivation: string | null;

  status: GoalStatus;
  importance: ImportanceLevel;
  /** 动态优先级分数 */
  priority: number;
  category: string | null;
  tags: string[];

  startDate: DomainDate | null;
  targetDate: DomainDate | null;
  completedAt: DomainDate | null;
  archivedAt: DomainDate | null;

  folderId: GoalFolderId | null;
  parentGoalId: GoalId | null;

  sortOrder: number;
  

  createdAt: DomainDate;
  updatedAt: DomainDate;
  deletedAt: DomainDate | null;
  version: number;

  keyResults: KeyResultClient[] | null;
  reviews: GoalReviewClient[] | null;
  reminderConfig: GoalReminderConfig | null;
}

// ============ Transfer DTO (传输�? ============

/**
 * Goal Time Range Summary
 * 时间范围概要（UI 用）
 */
export interface GoalTimeRangeSummary {
  startDate: TransferDate | null;
  targetDate: TransferDate | null;
  actualStartDate: TransferDate | null;
  actualEndDate: TransferDate | null;
  durationDays: number | null;
  elapsedDays: number | null;
  remainingDays: number | null;
}

/**
 * Goal Client DTO
 */
export interface GoalClientDTO {
  id: GoalId;
  identityId: IdentityId;
  name: string;
  description: string | null;
  color: string | null;
  feasibilityAnalysis: string | null;
  motivation: string | null;
  status: GoalStatus;
  importance: ImportanceLevel;
  /** 动态优先级分数 */
  priority: number;
  category: string | null;
  tags: string[];
  startDate: TransferDate | null;
  targetDate: TransferDate | null;
  completedAt: TransferDate | null;
  archivedAt: TransferDate | null;
  folderId: GoalFolderId | null;
  parentGoalId: GoalId | null;
  sortOrder: number;
  reminderConfig: GoalReminderConfigDTO | null;
  createdAt: TransferDate;
  updatedAt: TransferDate;
  deletedAt: TransferDate | null;
  version: number;

  // 子实体DTO
  keyResults: KeyResultClientDTO[] | null;
  reviews: GoalReviewClientDTO[] | null;
}
