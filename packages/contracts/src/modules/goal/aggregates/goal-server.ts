/**
 * Goal Aggregate Root - Server Contracts
 * 目标聚合�?- 服务端契�?
 *
 * 注意：Contracts 包只包含纯类型定义，不包含业务逻辑或方�?
 */

import type { DomainDate, TransferDate, PersistenceDate, GoalId, IdentityId, GoalFolderId } from '@/primitives';
import type { ImportanceLevel } from '../../../shared/index';
import type { GoalStatus } from '../value-objects/goal-status';
import type { KeyResultServer, KeyResultServerDTO, KeyResultPersistenceDTO } from '../entities/key-result-server';
import type { GoalReviewServer, GoalReviewServerDTO, GoalReviewPersistenceDTO } from '../entities/goal-review-server';
import type {
  GoalReminderConfig,
  GoalReminderConfigDTO,
  GoalReminderConfigPersistenceDTO,
} from '../value-objects';
import type { KeyResultWeightSnapshotDTO } from '../value-objects/key-result-weight-snapshot';

// ============ Domain Shape (领域�? ============

/**
 * Goal 聚合�?- Domain Shape
 * �?domain-server 中的 Class 实现�?
 */
export interface GoalServer {
  id: GoalId;
  identityId: IdentityId;

  // === 基础信息 ===
  name: string;
  description: string | null;
  color: string;

  feasibilityAnalysis: string | null;
  motivation: string | null;

  // === 状态与元数�?===
  status: GoalStatus;
  importance: ImportanceLevel;  /** 动态优先级分数（持久化属性） */
  priority: number;  category: string | null;
  tags: string[];

  keyResults: KeyResultServer[] | null;
  goalReviews: GoalReviewServer[] | null;

  startDate: DomainDate | null;
  targetDate: DomainDate | null;
  completedAt: DomainDate | null;
  archivedAt: DomainDate | null;

  folderId: GoalFolderId | null;
  parentGoalId: GoalId | null;

  sortOrder: number;
  reminderConfig: GoalReminderConfig | null;

  version: number;
  createdAt: DomainDate;
  updatedAt: DomainDate;
  deletedAt: DomainDate | null;
}

// ============ Transfer DTO (传输�? ============

/**
 * Goal Server DTO
 * API 传输�?
 */
export interface GoalServerDTO {
  id: GoalId;
  identityId: IdentityId;
  name: string;
  description: string | null;
  color: string;
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
  folderId: GoalFolderId | null;
  parentGoalId: GoalId | null;
  sortOrder: number;
  reminderConfig: GoalReminderConfigDTO | null;

  /** 计算属性：动态优先级分数 (0-100) */
  priority: number | null;

  keyResults: KeyResultServerDTO[] | null;
  weightSnapshots: KeyResultWeightSnapshotDTO[] | null;
  goalReviews: GoalReviewServerDTO[] | null;

  version: number;
  createdAt: TransferDate;
  updatedAt: TransferDate;
  deletedAt: TransferDate | null;
}

// ============ Persistence DTO (持久化层) ============

/**
 * Goal Persistence DTO
 * 数据库存储用
 */
export interface GoalPersistenceDTO {
  id: string;
  identityId: string;
  name: string;
  description: string | null;
  color: string;
  feasibilityAnalysis: string | null;
  motivation: string | null;
  status: string;
  importance: string;
  /** 
   * 动态优先级分数（持久化）
   * 用于高性能排序，每日 Cron Job 更新
   */
  priority: number;
  category: string | null;
  tags: string[];
  startDate: PersistenceDate | null;
  targetDate: PersistenceDate | null;
  completedAt: PersistenceDate | null;
  archivedAt: PersistenceDate | null;
  folderId: string | null;
  parentGoalId: string | null;
  sortOrder: number;
  reminderConfig: GoalReminderConfigPersistenceDTO | null; // JSON string

  keyResults: KeyResultPersistenceDTO[] | null;
  goalReviews: GoalReviewPersistenceDTO[] | null;
  weightSnapshots: KeyResultWeightSnapshotDTO[] | null;
  createdAt: PersistenceDate;
  updatedAt: PersistenceDate;
  deletedAt: PersistenceDate | null;
  version: number;
}
