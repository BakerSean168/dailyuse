/**
 * Goal Module - API Contracts (CRUD + Operations)
 * 
 * 【规范说明：API 层导出】
 * 使用 Zod Schema 定义所有请求，类型通过 z.infer 推导
 * 响应类型明确指向 DTO（aggregates/entities）
 */

import { z } from 'zod';
import type { GoalClientDTO, GoalFolderClientDTO, FocusSessionClientDTO } from '../aggregates';
import type { KeyResultServerDTO, GoalReviewServerDTO, GoalRecordClientDTO } from '../entities';

// ============================================================================
// GOAL CRUD Operations
// ============================================================================

/**
 * 创建目标 Schema
 */
export const CreateGoalSchema = z.object({
  title: z.string().min(1, '目标标题不能为空').max(256, '目标标题不能超过 256 字符'),
  description: z.string().max(2000, '描述不能超过 2000 字符').optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, '颜色必须是有效的 hex 格式').optional(),
  feasibilityAnalysis: z.string().max(2000).optional(),
  motivation: z.string().max(2000).optional(),
  importance: z.enum(['low', 'medium', 'high', 'critical'] as const),
  category: z.string().max(100).optional(),
  tags: z.array(z.string().max(50)).optional(),
  startDate: z.number().int().optional(),
  targetDate: z.number().int().optional(),
  folderUuid: z.string().uuid().optional(),
  parentGoalUuid: z.string().uuid().optional(),
});

export type CreateGoalReq = z.infer<typeof CreateGoalSchema>;
export type CreateGoalRes = GoalClientDTO;

/**
 * 更新目标 Schema
 */
export const UpdateGoalSchema = z.object({
  title: z.string().min(1).max(256).optional(),
  description: z.string().max(2000).nullable().optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i).nullable().optional(),
  feasibilityAnalysis: z.string().max(2000).nullable().optional(),
  motivation: z.string().max(2000).nullable().optional(),
  importance: z.enum(['low', 'medium', 'high', 'critical'] as const).optional(),
  category: z.string().max(100).nullable().optional(),
  tags: z.array(z.string().max(50)).nullable().optional(),
  startDate: z.number().int().nullable().optional(),
  targetDate: z.number().int().nullable().optional(),
  folderUuid: z.string().uuid().nullable().optional(),
  parentGoalUuid: z.string().uuid().nullable().optional(),
});

export type UpdateGoalReq = z.infer<typeof UpdateGoalSchema>;
export type UpdateGoalRes = GoalClientDTO;

/**
 * 获取目标详情
 */
export type GetGoalReq = void;
export type GetGoalRes = GoalClientDTO;

/**
 * 删除目标
 */
export type DeleteGoalReq = void;
export type DeleteGoalRes = GoalClientDTO;

/**
 * 查询目标列表 Schema
 */
export const QueryGoalsSchema = z.object({
  accountUuid: z.string().uuid('账户 UUID 无效'),
  status: z.array(z.string()).optional(),
  importance: z.array(z.enum(['low', 'medium', 'high', 'critical'] as const)).optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  folderUuid: z.string().uuid().optional(),
  keyword: z.string().max(256).optional(),
  startDate: z.number().int().optional(),
  endDate: z.number().int().optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'targetDate', 'priority']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  page: z.number().int().min(1).optional().default(1),
  pageSize: z.number().int().min(1).max(100).optional().default(20),
  includeKeyResults: z.boolean().optional().default(false),
  includeReviews: z.boolean().optional().default(false),
});

export type QueryGoalsReq = z.infer<typeof QueryGoalsSchema>;

export interface QueryGoalsRes {
  data: GoalClientDTO[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    hasMore: boolean;
    totalPages: number;
  };
}

/**
 * 获取目标聚合视图
 */
export type GetGoalAggregateReq = void;

export interface GetGoalAggregateRes {
  goal: GoalClientDTO;
  keyResults?: KeyResultServerDTO[];
  records?: GoalRecordClientDTO[];
  reviews?: GoalReviewServerDTO[];
  statistics?: {
    totalKeyResults: number;
    completedKeyResults: number;
    totalRecords: number;
    totalReviews: number;
    overallProgress: number;
  };
}

/**
 * 批量更新目标状态 Schema
 */
export const BatchUpdateGoalStatusSchema = z.object({
  goalUuids: z.array(z.string().uuid()).min(1, '至少需要选择一个目标'),
  status: z.string().min(1, '状态不能为空'),
});

export type BatchUpdateGoalStatusReq = z.infer<typeof BatchUpdateGoalStatusSchema>;
export type BatchUpdateGoalStatusRes = GoalClientDTO[];

/**
 * 批量移动目标 Schema
 */
export const BatchMoveGoalsSchema = z.object({
  goalUuids: z.array(z.string().uuid()).min(1),
  targetFolderUuid: z.string().uuid('目标文件夹 UUID 无效'),
});

export type BatchMoveGoalsReq = z.infer<typeof BatchMoveGoalsSchema>;
export type BatchMoveGoalsRes = GoalClientDTO[];

/**
 * 批量删除目标 Schema
 */
export const BatchDeleteGoalsSchema = z.object({
  goalUuids: z.array(z.string().uuid()).min(1),
  hardDelete: z.boolean().optional().default(false),
});

export type BatchDeleteGoalsReq = z.infer<typeof BatchDeleteGoalsSchema>;
export type BatchDeleteGoalsRes = void;

// ============================================================================
// KEY RESULT Operations
// ============================================================================

/**
 * 添加关键结果 Schema
 */
export const AddKeyResultSchema = z.object({
  goalUuid: z.string().uuid('目标 UUID 无效'),
  title: z.string().min(1, '关键结果标题不能为空').max(256),
  description: z.string().max(2000).optional(),
  valueType: z.string().min(1, '关键结果类型不能为空'),
  calculationMethod: z.string().min(1, '计算方法不能为空'),
  targetValue: z.number().min(0, '目标值不能为负数'),
  currentValue: z.number().optional(),
  unit: z.string().max(50).optional(),
  weight: z.number().min(0).max(1, '权重必须在 0-1 之间'),
});

export type AddKeyResultReq = z.infer<typeof AddKeyResultSchema>;
export type AddKeyResultRes = KeyResultServerDTO;

/**
 * 更新关键结果 Schema
 */
export const UpdateKeyResultSchema = z.object({
  title: z.string().min(1).max(256).optional(),
  description: z.string().max(2000).nullable().optional(),
  startValue: z.number().optional(),
  targetValue: z.number().optional(),
  unit: z.string().max(50).nullable().optional(),
  weight: z.number().min(0).max(1).optional(),
});

export type UpdateKeyResultReq = z.infer<typeof UpdateKeyResultSchema>;
export type UpdateKeyResultRes = KeyResultServerDTO;

/**
 * 获取关键结果列表
 */
export const GetKeyResultsSchema = z.object({
  goalUuid: z.string().uuid('目标 UUID 无效'),
});

export type GetKeyResultsReq = z.infer<typeof GetKeyResultsSchema>;

export interface GetKeyResultsRes {
  data: KeyResultServerDTO[];
  total: number;
}

/**
 * 更新关键结果进度 Schema
 */
export const UpdateKeyResultProgressSchema = z.object({
  keyResultUuid: z.string().uuid('关键结果 UUID 无效'),
  newValue: z.number().min(0, '新值不能为负数'),
  note: z.string().max(500).optional(),
});

export type UpdateKeyResultProgressReq = z.infer<typeof UpdateKeyResultProgressSchema>;
export type UpdateKeyResultProgressRes = KeyResultServerDTO;

// ============================================================================
// GOAL FOLDER Operations
// ============================================================================

/**
 * 创建文件夹 Schema
 */
export const CreateGoalFolderSchema = z.object({
  name: z.string().min(1, '文件夹名称不能为空').max(256),
  description: z.string().max(2000).optional(),
  icon: z.string().max(100).optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
  parentFolderUuid: z.string().uuid().optional(),
});

export type CreateGoalFolderReq = z.infer<typeof CreateGoalFolderSchema>;
export type CreateGoalFolderRes = GoalFolderClientDTO;

/**
 * 更新文件夹 Schema
 */
export const UpdateGoalFolderSchema = z.object({
  name: z.string().min(1).max(256).optional(),
  description: z.string().max(2000).nullable().optional(),
  icon: z.string().max(100).nullable().optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i).nullable().optional(),
  parentFolderUuid: z.string().uuid().nullable().optional(),
});

export type UpdateGoalFolderReq = z.infer<typeof UpdateGoalFolderSchema>;
export type UpdateGoalFolderRes = GoalFolderClientDTO;

/**
 * 获取文件夹详情
 */
export type GetGoalFolderReq = void;
export type GetGoalFolderRes = GoalFolderClientDTO;

/**
 * 删除文件夹
 */
export type DeleteGoalFolderReq = void;
export type DeleteGoalFolderRes = GoalFolderClientDTO;

/**
 * 查询文件夹列表 Schema
 */
export const QueryGoalFoldersSchema = z.object({
  accountUuid: z.string().uuid('账户 UUID 无效'),
  parentFolderUuid: z.string().uuid().optional(),
  includeSystemFolders: z.boolean().optional().default(false),
  sortBy: z.enum(['name', 'createdAt', 'sortOrder']).optional().default('name'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
});

export type QueryGoalFoldersReq = z.infer<typeof QueryGoalFoldersSchema>;

export interface QueryGoalFoldersRes {
  data: GoalFolderClientDTO[];
  total: number;
}

// ============================================================================
// GOAL REVIEW Operations
// ============================================================================

/**
 * 创建复盘 Schema
 */
export const CreateGoalReviewSchema = z.object({
  goalUuid: z.string().uuid('目标 UUID 无效'),
  title: z.string().min(1, '复盘标题不能为空').max(256),
  content: z.string().min(1, '复盘内容不能为空').max(10000),
  reviewType: z.string().min(1, '复盘类型不能为空').max(100),
  rating: z.number().int().min(1).max(5).optional(),
  achievements: z.string().max(2000).optional(),
  challenges: z.string().max(2000).optional(),
  nextActions: z.string().max(2000).optional(),
  reviewedAt: z.number().int().optional(),
});

export type CreateGoalReviewReq = z.infer<typeof CreateGoalReviewSchema>;
export type CreateGoalReviewRes = GoalReviewServerDTO;

/**
 * 更新复盘 Schema
 */
export const UpdateGoalReviewSchema = z.object({
  title: z.string().min(1).max(256).optional(),
  content: z.string().min(1).max(10000).optional(),
  rating: z.number().int().min(1).max(5).nullable().optional(),
  achievements: z.string().max(2000).nullable().optional(),
  challenges: z.string().max(2000).nullable().optional(),
  nextActions: z.string().max(2000).nullable().optional(),
});

export type UpdateGoalReviewReq = z.infer<typeof UpdateGoalReviewSchema>;
export type UpdateGoalReviewRes = GoalReviewServerDTO;

/**
 * 获取复盘详情
 */
export type GetGoalReviewReq = void;
export type GetGoalReviewRes = GoalReviewServerDTO;

/**
 * 删除复盘
 */
export type DeleteGoalReviewReq = void;
export type DeleteGoalReviewRes = GoalReviewServerDTO;

/**
 * 查询复盘列表
 */
export const GetGoalReviewsSchema = z.object({
  goalUuid: z.string().uuid('目标 UUID 无效'),
});

export type GetGoalReviewsReq = z.infer<typeof GetGoalReviewsSchema>;

export interface GetGoalReviewsRes {
  data: GoalReviewServerDTO[];
  total: number;
}

// ============================================================================
// GOAL RECORD Operations
// ============================================================================

/**
 * 创建目标记录 Schema
 */
export const CreateGoalRecordSchema = z.object({
  value: z.number().min(0, '记录值不能为负数'),
  note: z.string().max(500).optional(),
  recordedAt: z.number().int().optional(),
});

export type CreateGoalRecordReq = z.infer<typeof CreateGoalRecordSchema>;
export type CreateGoalRecordRes = GoalRecordClientDTO;

/**
 * 获取目标记录列表
 */
export const GetGoalRecordsSchema = z.object({
  goalUuid: z.string().uuid('目标 UUID 无效'),
  limit: z.number().int().min(1).max(100).optional().default(20),
  offset: z.number().int().min(0).optional().default(0),
});

export type GetGoalRecordsReq = z.infer<typeof GetGoalRecordsSchema>;

export interface GetGoalRecordsRes {
  data: GoalRecordClientDTO[];
  total: number;
}

// ============================================================================
// FOCUS SESSION Operations
// ============================================================================

/**
 * 开始专注 Schema
 */
export const StartFocusSchema = z.object({
  goalUuid: z.string().uuid().optional(),
  durationMinutes: z.number().int().min(1, '时长必须至少 1 分钟').max(480, '时长不能超过 480 分钟'),
  description: z.string().max(500).optional(),
});

export type StartFocusReq = z.infer<typeof StartFocusSchema>;
export type StartFocusRes = FocusSessionClientDTO;

/**
 * 停止专注 Schema
 */
export const StopFocusSchema = z.object({
  notes: z.string().max(500).optional(),
});

export type StopFocusReq = z.infer<typeof StopFocusSchema>;
export type StopFocusRes = FocusSessionClientDTO;

/**
 * 获取专注状态
 */
export type GetFocusStatusReq = void;

export interface GetFocusStatusRes {
  isActive: boolean;
  session: FocusSessionClientDTO | null;
  goalTitle?: string;
  remainingSeconds?: number;
  elapsedSeconds?: number;
}

/**
 * 查询专注历史 Schema
 */
export const GetFocusHistorySchema = z.object({
  goalUuid: z.string().uuid().optional(),
  startDate: z.number().int().optional(),
  endDate: z.number().int().optional(),
  limit: z.number().int().min(1).max(100).optional().default(20),
  offset: z.number().int().min(0).optional().default(0),
});

export type GetFocusHistoryReq = z.infer<typeof GetFocusHistorySchema>;

export interface GetFocusHistoryRes {
  data: FocusSessionClientDTO[];
  totalSessions: number;
  totalDurationMinutes: number;
  averageDurationMinutes: number;
  completionRate: number;
}

/**
 * 获取专注统计
 */
export type GetFocusStatisticsReq = void;

export interface GetFocusStatisticsRes {
  todayDurationMinutes: number;
  weekDurationMinutes: number;
  monthDurationMinutes: number;
  totalSessions: number;
  completedSessions: number;
  averageSessionDurationMinutes: number;
  longestStreak: number;
  currentStreak: number;
}

/**
 * 获取番茄钟配置
 */
export type GetPomodoroConfigReq = void;

export interface GetPomodoroConfigRes {
  focusDurationMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  sessionsBeforeLongBreak: number;
  autoStartBreaks: boolean;
  autoStartFocus: boolean;
  soundEnabled: boolean;
  notificationEnabled: boolean;
}

// ============================================================================
// DECOMPOSITION Operations (AI-powered)
// ============================================================================

/**
 * AI 目标分解 Schema
 */
export const DecomposeGoalSchema = z.object({
  goalId: z.string().uuid('目标 ID 无效'),
  goalTitle: z.string().min(1, '目标标题不能为空'),
  goalDescription: z.string().max(5000).optional(),
  goalDeadline: z.coerce.date().optional(),
  existingTasks: z.array(z.object({
    title: z.string(),
    id: z.string(),
  })).optional(),
  userContext: z.object({
    workHoursPerDay: z.number().optional(),
    skillLevel: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
    previousSimilarGoals: z.number().int().optional(),
  }).optional(),
  provider: z.enum(['openai', 'anthropic', 'local']).optional().default('local'),
  useCache: z.boolean().optional().default(true),
});

export type DecomposeGoalReq = z.infer<typeof DecomposeGoalSchema>;

export interface DecomposeGoalRes {
  tasks: Array<{
    title: string;
    description: string;
    estimatedMinutes: number;
    complexity: 'simple' | 'medium' | 'complex';
    dependencies: string[];
    suggestedOrder: number;
  }>;
  timeline: {
    totalEstimatedHours: number;
    suggestedStartDate?: Date;
    suggestedEndDate?: Date;
    estimatedDays?: number;
  };
  risks: Array<{
    description: string;
    mitigation: string;
  }>;
  confidence?: number;
}

// ============================================================================
// IMPORT/EXPORT Operations
// ============================================================================

/**
 * 导出目标 Schema
 */
export const ExportGoalsSchema = z.object({
  accountUuid: z.string().uuid('账户 UUID 无效'),
  goalUuids: z.array(z.string().uuid()).optional(),
  format: z.enum(['json', 'csv', 'markdown']),
  includeKeyResults: z.boolean().optional().default(true),
  includeReviews: z.boolean().optional().default(true),
});

export type ExportGoalsReq = z.infer<typeof ExportGoalsSchema>;

export interface ExportGoalsRes {
  data: string | Uint8Array;
  filename: string;
  mimeType: string;
}

/**
 * 导入目标 Schema
 */
export const ImportGoalsSchema = z.object({
  accountUuid: z.string().uuid('账户 UUID 无效'),
  data: z.union([z.string(), z.instanceof(Uint8Array)]),
  format: z.enum(['json', 'csv']),
  folderUuid: z.string().uuid().optional(),
  overwriteExisting: z.boolean().optional().default(false),
});

export type ImportGoalsReq = z.infer<typeof ImportGoalsSchema>;

export interface ImportGoalsRes {
  importedCount: number;
  skippedCount: number;
  errors?: Array<{
    line: number;
    error: string;
  }>;
}

// ============================================================================
// TIME ESTIMATION Operations
// ============================================================================

/**
 * 时间估算 Schema
 */
export const EstimateTimeSchema = z.object({
  taskId: z.string().uuid().optional(),
  taskTitle: z.string().min(1, '任务标题不能为空').max(256),
  taskDescription: z.string().max(2000).optional(),
  complexity: z.enum(['simple', 'medium', 'complex']).optional().default('medium'),
  dependencies: z.array(z.string()).optional(),
  historicalData: z.object({
    averageMinutes: z.number().optional(),
    userSpeedFactor: z.number().optional(),
    estimationAccuracy: z.number().optional(),
  }).optional(),
});

export type EstimateTimeReq = z.infer<typeof EstimateTimeSchema>;

export interface EstimateTimeRes {
  taskId?: string;
  taskTitle: string;
  estimatedMinutes: number;
  confidenceScore: number;
  reasoning: string;
  breakdown?: {
    analysis?: number;
    implementation?: number;
    testing?: number;
    buffer?: number;
  };
  adjustedMinutes?: number;
  adjustmentReason?: string;
}

/**
 * 批量时间估算
 */
export const BatchEstimateTimeSchema = z.object({
  tasks: z.array(EstimateTimeSchema).min(1, '至少需要估算一个任务'),
});

export type BatchEstimateTimeReq = z.infer<typeof BatchEstimateTimeSchema>;

export interface BatchEstimateTimeRes {
  estimates: EstimateTimeRes[];
  totalMinutes: number;
  averageConfidence: number;
  generatedAt: Date;
}
