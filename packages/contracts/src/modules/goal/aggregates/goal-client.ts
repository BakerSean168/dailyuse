/**
 * Goal Aggregate Root - Client Contracts
 * 目标聚合�?- 客户端契�?
 *
 * 注意：Contracts 包只包含纯类型定义，不包含业务逻辑或方�?
 */

import type { DomainDate, TransferDate, GoalId, IdentityId, GoalFolderId } from '@/primitives';
import type { ImportanceLevel } from '../../../shared/index';
import type { GoalStatus } from '../value-objects/goal-status';
import type { KeyResultClientDTO } from '../entities/key-result-client';
import type { GoalReviewClientDTO } from '../entities/goal-review-client';
import type { GoalReminderConfig, GoalReminderConfigDTO } from '../value-objects';

// ============ Domain Shape (领域�? ============

/**
 * Goal 聚合�?- Client Domain Shape
 * �?domain-client 中的 Class 实现�?
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
  category: string | null;
  tags: string[];

  startDate: DomainDate | null;
  targetDate: DomainDate | null;
  completedAt: DomainDate | null;
  archivedAt: DomainDate | null;

  folderId: GoalFolderId | null;
  parentGoalId: GoalId | null;

  sortOrder: number;
  reminderConfig: GoalReminderConfig | null;

  createdAt: DomainDate;
  updatedAt: DomainDate;

  keyResults: KeyResultClientDTO[] | null;

  // === [UI 计算字段] 后端算好返回，减轻前端负�?===
  progress: number;            // 总进�?0-100
  isOverdue: boolean;          // 是否逾期
  daysRemaining: number | null;// 剩余天数
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
 * API 传输�?
 */
export interface GoalClientDTO {
  id: string;
  identityId: string;
  name: string;
  description: string | null;
  color: string | null;
  feasibilityAnalysis: string | null;
  motivation: string | null;
  status: GoalStatus;
  importance: ImportanceLevel;
  category: string | null;
  tags: string[];
  startDate: TransferDate | null;
  targetDate: TransferDate | null;
  completedAt: TransferDate | null;
  archivedAt: TransferDate | null;
  folderId: string | null;
  parentGoalId: string | null;
  sortOrder: number;
  reminderConfig: GoalReminderConfigDTO | null;
  createdAt: TransferDate;
  updatedAt: TransferDate;
  deletedAt: TransferDate | null;

  // 子实体DTO
  keyResults: KeyResultClientDTO[] | null;
  reviews: GoalReviewClientDTO[] | null;

  // 计算属性（由服务端或客户端计算）
  priority: number | null;
  progress: number | null;
  timeRangeSummary: GoalTimeRangeSummary | null;
}
