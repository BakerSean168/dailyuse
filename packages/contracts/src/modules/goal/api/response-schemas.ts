/**
 * Goal - Response Schemas (Zod)
 *
 * OpenAPI 响应体 Zod Schema，与 DTO 类型约束对齐。
 * 路由文件统一从此处导入，不在本地重复定义。
 */

import { z } from 'zod';
import { brandedId } from '../../../primitives';
import type {
  GoalId,
  GoalFolderId,
  GoalReviewId,
  KeyResultId,
  IdentityId,
  GoalRecordId,
  FocusSessionId,
} from '../../../primitives';
import { GoalStatus } from '../value-objects/goal-status';
import { ImportanceLevel } from '../../../shared/value-objects/importance';
import { ReviewType } from '../value-objects/review-type';
import { FocusSessionStatus } from '../value-objects/focus-session-status';
import { FolderType } from '../value-objects/folder-type';

import type { GoalClientDTO } from '../aggregates/goal-client';
import type { GoalFolderClientDTO } from '../aggregates/goal-folder-client';
import type { GoalReviewClientDTO } from '../entities/goal-review-client';
import type { KeyResultClientDTO } from '../entities/key-result-client';

import { KeyResultProgressDTOSchema } from '../value-objects/key-result-progress';
import { KeyResultSnapshotDTOSchema } from '../value-objects/key-result-snapshot';

// Residual 737: KeyResultProgressDTOSchema / KeyResultSnapshotDTOSchema owned by value-objects
// (semantic DTOs are z.infer aliases). Re-export for OpenAPI/route consumers.
export { KeyResultProgressDTOSchema, KeyResultSnapshotDTOSchema };

import {
  GoalReminderConfigDTOSchema,
  ReminderTriggerSchema,
} from '../value-objects/goal-reminder-config';

// Residual 741: GoalReminderConfigDTOSchema / ReminderTriggerSchema owned by value-objects
// (semantic DTOs are z.infer aliases). Re-export for OpenAPI/route consumers.
export { GoalReminderConfigDTOSchema, ReminderTriggerSchema };

import { FocusModeClientDTOSchema } from '../value-objects/focus-mode';

// Residual 745: FocusModeClientDTOSchema owned by value-objects
// (semantic FocusModeDTO is a z.infer alias). Re-export for OpenAPI/route consumers.
export { FocusModeClientDTOSchema };


// ============================================================================
// Sub-entity Schemas
// ============================================================================


/**
 * KeyResult Client DTO Schema
 */
export const KeyResultClientDTOSchema: z.ZodType<KeyResultClientDTO> = z.object({
  id: brandedId<KeyResultId>(),
  title: z.string(),
  description: z.string().nullable(),
  progress: KeyResultProgressDTOSchema,
  weight: z.number().int().min(1).max(5),
  order: z.number(),
  version: z.number(),
  createdAt: z.number(),
  updatedAt: z.number(),
  deletedAt: z.number().nullable(),
});


/**
 * GoalReview Client DTO Schema
 */
export const GoalReviewClientDTOSchema: z.ZodType<GoalReviewClientDTO> = z.object({
  id: brandedId<GoalReviewId>(),
  goalId: brandedId<GoalId>(),
  type: z.enum(ReviewType),
  rating: z.number(),
  summary: z.string(),
  achievements: z.string().nullable(),
  challenges: z.string().nullable(),
  improvements: z.string().nullable(),
  keyResultSnapshots: z.array(KeyResultSnapshotDTOSchema),
  version: z.number(),
  reviewedAt: z.number(),
  createdAt: z.number(),
  updatedAt: z.number(),
  deletedAt: z.number().nullable(),
});



// ============================================================================
// Aggregate Root Response Schemas
// ============================================================================

/**
 * Goal Client DTO Schema — 核心聚合根响应
 *
 * 严格约束为 GoalClientDTO 类型，用于 OpenAPI 文档和运行时校验。
 */
export const GoalClientDTOSchema: z.ZodType<GoalClientDTO> = z.object({
  id: brandedId<GoalId>(),
  identityId: brandedId<IdentityId>(),
  name: z.string(),
  description: z.string().nullable(),
  color: z.string().nullable(),
  feasibilityAnalysis: z.string().nullable(),
  motivation: z.string().nullable(),
  status: z.enum(GoalStatus),
  importance: z.enum(ImportanceLevel),
  priority: z.number(),
  category: z.string().nullable(),
  tags: z.array(z.string()),
  startDate: z.number().nullable(),
  targetDate: z.number().nullable(),
  completedAt: z.number().nullable(),
  archivedAt: z.number().nullable(),
  folderId: brandedId<GoalFolderId>().nullable(),
  parentGoalId: brandedId<GoalId>().nullable(),
  sortOrder: z.number(),
  reminderConfig: GoalReminderConfigDTOSchema.nullable(),
  createdAt: z.number(),
  updatedAt: z.number(),
  deletedAt: z.number().nullable(),
  version: z.number(),
  keyResults: z.array(KeyResultClientDTOSchema).nullable(),
  reviews: z.array(GoalReviewClientDTOSchema).nullable(),
  totalKeyResults: z.number().optional(),
  completedKeyResults: z.number().optional(),
  overallProgress: z.number().optional(),
});

/**
 * GoalFolder Client DTO Schema
 */
export const GoalFolderClientDTOSchema: z.ZodType<GoalFolderClientDTO> = z.object({
  id: brandedId<GoalFolderId>(),
  identityId: brandedId<IdentityId>(),
  name: z.string(),
  description: z.string().nullable(),
  icon: z.string().nullable(),
  color: z.string().nullable(),
  parentFolderId: brandedId<GoalFolderId>().nullable(),
  sortOrder: z.number(),
  isSystemFolder: z.boolean(),
  folderType: z.enum(FolderType).nullable(),
  goalCount: z.number(),
  completedGoalCount: z.number(),
  version: z.number(),
  createdAt: z.number(),
  updatedAt: z.number(),
  deletedAt: z.number().nullable(),
  displayName: z.string(),
  displayIcon: z.string(),
  completionRate: z.number(),
  activeGoalCount: z.number(),
});

/**
 * FocusSession Client DTO Schema
 */
export const FocusSessionClientDTOSchema = z.object({
  id: brandedId<FocusSessionId>(),
  identityId: brandedId<IdentityId>(),
  goalId: brandedId<GoalId>().nullable(),
  status: z.enum(FocusSessionStatus),
  durationMinutes: z.number(),
  actualDurationMinutes: z.number(),
  description: z.string().nullable(),
  startedAt: z.number().nullable(),
  pausedAt: z.number().nullable(),
  resumedAt: z.number().nullable(),
  completedAt: z.number().nullable(),
  cancelledAt: z.number().nullable(),
  pauseCount: z.number(),
  pausedDurationMinutes: z.number(),
  remainingMinutes: z.number().optional(),
  progressPercentage: z.number().optional(),
  isActive: z.boolean().optional(),
  version: z.number(),
  createdAt: z.number(),
  updatedAt: z.number(),
  deletedAt: z.number().nullable(),
});

/**
 * GoalRecord Client DTO Schema
 */
export const GoalRecordClientDTOSchema = z.object({
  id: brandedId<GoalRecordId>(),
  keyResultId: brandedId<KeyResultId>(),
  goalId: brandedId<GoalId>(),
  value: z.number(),
  valueAfter: z.number(),
  comment: z.string().nullable(),
  version: z.number(),
  createdAt: z.number(),
  updatedAt: z.number(),
  deletedAt: z.number().nullable(),
});

// ============================================================================
// Composite Response Schemas
// ============================================================================

/**
 * 分页信息 Schema
 */
export const PaginationSchema = z.object({
  page: z.number(),
  pageSize: z.number(),
  total: z.number(),
  hasMore: z.boolean(),
  totalPages: z.number(),
});

/**
 * 目标列表查询响应 Schema
 */
export const QueryGoalsResSchema = z.object({
  data: z.array(GoalClientDTOSchema),
  pagination: PaginationSchema,
});

export type QueryGoalsRes = z.infer<typeof QueryGoalsResSchema>;

/**
 * 目标聚合视图响应 Schema
 */
export const GetGoalAggregateResSchema = z.object({
  goal: GoalClientDTOSchema,
  keyResults: z.array(KeyResultClientDTOSchema).optional(),
  records: z.array(GoalRecordClientDTOSchema).optional(),
  reviews: z.array(GoalReviewClientDTOSchema).optional(),
  statistics: z
    .object({
      totalKeyResults: z.number(),
      completedKeyResults: z.number(),
      totalRecords: z.number(),
      totalReviews: z.number(),
      overallProgress: z.number(),
    })
    .optional(),
});

export type GetGoalAggregateRes = z.infer<typeof GetGoalAggregateResSchema>;

// ============================================================================
// List Response Schemas
// ============================================================================

// Residual 689: goal list OpenAPI schemas are the sole list response shapes
// (GetKeyResultsRes / GetGoalRecordsRes / GetGoalReviewsRes are z.infer aliases).
/**
 * 关键结果列表响应 Schema
 */
export const KeyResultListResSchema = z.object({
  data: z.array(KeyResultClientDTOSchema),
  total: z.number(),
});

/**
 * 进度记录列表响应 Schema
 */
export const GoalRecordListResSchema = z.object({
  data: z.array(GoalRecordClientDTOSchema),
  total: z.number(),
});

/**
 * 复盘列表响应 Schema
 */
export const GoalReviewListResSchema = z.object({
  data: z.array(GoalReviewClientDTOSchema),
  total: z.number(),
});

// ============================================================================
// Simple Response Schemas
// ============================================================================


/**
 * 归档过期目标响应 Schema
 */
export const ArchiveExpiredResSchema = z.object({ archivedCount: z.number() });

/**
 * 进度分解响应 Schema
 */
export const ProgressBreakdownResSchema = z.object({
  totalProgress: z.number(),
  calculationMode: z.literal('WeightedAverage'),
  krContributions: z.array(
    z.object({
      keyResultId: brandedId<KeyResultId>(),
      keyResultName: z.string(),
      progress: z.number(),
      weight: z.number(),
      contribution: z.number(),
    }),
  ),
  lastUpdateTime: z.number(),
  updateTrigger: z.string(),
});

// ============================================================================
// Request Schemas
// ============================================================================

/**
 * 批量更新关键结果权重请求 Schema
 */
export const BatchUpdateKeyResultWeightsReqSchema = z.object({
  updates: z.array(
    z.object({
      keyResultId: brandedId<KeyResultId>(),
      weight: z.number().int().min(1).max(5),
    }),
  ),
});
