/**
 * TaskTemplate Aggregate Root - Server Interface
 * 任务模板聚合�?
 */

import type {
  TaskTemplateId,
  TaskInstanceId,
  IdentityId,
  GoalId,
  KeyResultId,
  GoalFolderId,
  DomainDate,
  TransferDate,
  PersistenceDate,
} from '@/primitives';
import type { TaskType } from '../value-objects/task-type';
import type { TaskTemplateStatus } from '../value-objects/task-template-status';
import type { TaskInstanceServerDTO } from './task-instance-server';
import type { TaskTemplateHistoryServerDTO } from '../entities';
import type {
  TaskTimeConfig,
  TaskTimeConfigDTO,
  RecurrenceRule,
  RecurrenceRuleDTO,
  TaskReminderConfig,
  TaskReminderConfigDTO,
  TaskGoalBinding,
  TaskGoalBindingDTO,
} from '../value-objects';

// 导入共享类型
import { ImportanceLevel } from '../../../shared/importance';

// ============ DTO 定义 ============

/**
 * TaskTemplate Server DTO
 */
export interface TaskTemplateServerDTO {
  id: string;
  identityId: string;
  name: string;
  description: string | null;

  // === 循环任务专用 ===
  timeConfig: TaskTimeConfigDTO | null;
  recurrenceRule: RecurrenceRuleDTO | null;
  reminderConfig: TaskReminderConfigDTO | null;
  lastGeneratedDate: TransferDate | null;
  generateAheadDays: number | null;

  importance: ImportanceLevel;
  priority?: number;
  tags: string[];
  color: string | null;
  status: TaskTemplateStatus;

  goalBinding: TaskGoalBindingDTO | null;

  parentTaskId: string | null;

  dependencyStatus?: string; // 'NONE' | 'WAITING' | 'READY' | 'BLOCKED'
  isBlocked?: boolean;
  blockingReason: string | null;

  // === 其他 ===
  folderId: string | null;
  createdAt: TransferDate;
  updatedAt: TransferDate;
  deletedAt: TransferDate | null;
  history?: TaskTemplateHistoryServerDTO[];
  instances?: TaskInstanceServerDTO[]; 
}

/**
 * TaskTemplate Persistence DTO
 */
export interface TaskTemplatePersistenceDTO {
  id: string;
  identityId: string;
  name: string;
  description: string | null;

  // === 循环任务专用 ===
  // Flattened timeConfig
  timeConfigType: string | null;
  timeConfigStartTime: Date | null;
  timeConfigEndTime: Date | null;
  timeConfigDurationMinutes: number | null;

  // Flattened recurrence_rule
  recurrenceRuleType: string | null;
  recurrenceRuleInterval: number | null;
  recurrenceRuleDaysOfWeek: string | null; // JSON array
  recurrenceRuleDayOfMonth: number | null;
  recurrenceRuleMonthOfYear: number | null;
  recurrenceRuleEndDate: Date | null;
  recurrenceRuleCount: number | null;

  // Flattened reminderConfig
  reminderConfigEnabled: boolean | null;
  reminderConfigTimeOffsetMinutes: number | null;
  reminderConfigUnit: string | null;
  reminderConfigChannel: string | null;

  lastGeneratedDate: Date | null;
  generateAheadDays: number | null;

  // === 通用属�?===
  importance: string; // 'vital' | 'important' | 'moderate' | 'minor' | 'trivial'
  tags: string; // JSON array
  color: string | null;
  status: string;

  // === Goal/KR 关联（通用�?===
  goalId: string | null;
  keyResultId: string | null;

  // Flattened goal_binding (仅循环任务高级绑�?
  goalBindingGoalId: string | null;
  goalBindingKeyResultId: string | null;
  goalBindingIncrementValue: number | null;

  // === 子任务支持（通用�?===
  parentTaskId: string | null;

  // === 一次性任务专�?===
  startDate: PersistenceDate | null;
  dueDate: PersistenceDate | null;
  completedAt: PersistenceDate | null;
  estimatedMinutes: number | null;
  actualMinutes: number | null;
  note: string | null;

  // === 依赖关系（通用�?===
  dependencyStatus?: string; // 'NONE' | 'WAITING' | 'READY' | 'BLOCKED'
  isBlocked?: boolean;
  blockingReason: string | null;

  // === 其他 ===
  folderId: string | null;
  createdAt: PersistenceDate;
  updatedAt: PersistenceDate;
  deletedAt: PersistenceDate | null;
}

// ============ 聚合根接�?============

export interface TaskTemplateServer {
  id: TaskTemplateId;
  identityId: IdentityId;
  name: string;
  description: string | null;
  taskType: TaskType;
  timeConfig: TaskTimeConfig | null; // null for ONE_TIME tasks
  recurrenceRule: RecurrenceRule | null;
  reminderConfig: TaskReminderConfig | null;
  importance: ImportanceLevel;
  goalBinding: TaskGoalBinding | null;
  folderId: GoalFolderId | null;
  tags: string[];
  color: string | null;
  status: TaskTemplateStatus;
  lastGeneratedDate: DomainDate | null;
  generateAheadDays: number | null; // null for ONE_TIME tasks
  createdAt: DomainDate;
  updatedAt: DomainDate;
  deletedAt: DomainDate | null;
  history: TaskTemplateHistoryServerDTO[];
  instances: TaskInstanceServerDTO[];

}
