/**
 * Goal Aggregate Root - Server Contracts
 * 目标聚合�?- 服务端契�?
 *
 * 注意：Contracts 包只包含纯类型定义，不包含业务逻辑或方�?
 */

import type { DomainDate, TransferDate, PersistenceDate, GoalId, IdentityId, GoalFolderId } from '@/primitives';
import type { ImportanceLevel } from '../../../shared/index';
import type { GoalStatus } from '../value-objects/goal-status';
import type { KeyResultServerDTO, KeyResultPersistenceDTO } from '../entities/key-result-server';
import type { GoalReviewServerDTO, GoalReviewPersistenceDTO } from '../entities/goal-review-server';
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
  deletedAt: DomainDate | null;
}

// ============ Transfer DTO (传输�? ============

/**
 * Goal Server DTO
 * API 传输�?
 */
export interface GoalServerDTO {
  id: string;
  identityId: string;
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
  folderId: string | null;
  parentGoalId: string | null;
  sortOrder: number;
  reminderConfig: GoalReminderConfigDTO | null;

  /** 计算属性：动态优先级分数 (0-100) */
  priority: number | null;

  // 子实�?DTO (可选加�?
  keyResults: KeyResultServerDTO[] | null;
  weightSnapshots: KeyResultWeightSnapshotDTO[] | null;

  version: number;
  createdAt: TransferDate;
  updatedAt: TransferDate;
  deletedAt: TransferDate | null;
}

// ============ Persistence DTO (持久化层) ============

/**
 * Goal Persistence DTO
 * 数据库存储用
 * 注意：使�?| null 而非 ?，与数据�?NULL 对应
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
  category: string | null;
  tags: string; // JSON string
  startDate: PersistenceDate | null;
  targetDate: PersistenceDate | null;
  completedAt: PersistenceDate | null;
  archivedAt: PersistenceDate | null;
  folderId: string | null;
  parentGoalId: string | null;
  sortOrder: number;
  reminderConfig: string | null; // JSON string
  createdAt: PersistenceDate;
  updatedAt: PersistenceDate;
  deletedAt: PersistenceDate | null;
  // 注意：子实体在数据库中是独立表，Persistence 层不包含子实体数�?
}

// ============ Static Factory Interface ============

/**
 * Goal Server 静态工厂接�?
 */
// 事件定义已移�?protocol/goal-event-map.ts
