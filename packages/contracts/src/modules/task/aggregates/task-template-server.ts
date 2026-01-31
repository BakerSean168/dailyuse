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
import type { TaskTemplateClientDTO } from './task-template-client';
import type {
  TaskTimeConfigServer,
  TaskTimeConfigServerDTO,
  TaskTimeConfigClientDTO,
  RecurrenceRuleServer,
  RecurrenceRuleServerDTO,
  RecurrenceRuleClientDTO,
  TaskReminderConfigServer,
  TaskReminderConfigServerDTO,
  TaskReminderConfigClientDTO,
  TaskGoalBindingServer,
  TaskGoalBindingServerDTO,
  TaskGoalBindingClientDTO,
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
  taskType: TaskType; // 'ONE_TIME' | 'RECURRING'

  // === 循环任务专用 ===
  timeConfig: TaskTimeConfigServerDTO | null;
  recurrenceRule: RecurrenceRuleServerDTO | null;
  reminderConfig: TaskReminderConfigServerDTO | null;
  lastGeneratedDate: TransferDate | null;
  generateAheadDays: number | null;

  // === 通用属�?===
  importance: ImportanceLevel;
  /**
   * 优先级分�?(0-100)
   * 由系统根�?importance + dueDate 动态计�?
   * @readonly 此字段不能直接修改，计算�?Application Layer 负责
   * @computed 基于 Story 1.3 算法计算得出
   */
  priority?: number;
  tags: string[];
  color: string | null;
  status: TaskTemplateStatus;

  // === Goal/KR 关联（通用�?===
  goalId: string | null;
  keyResultId: string | null;
  goalBinding: TaskGoalBindingServerDTO | null; // 仅循环任务使用的高级绑定

  // === 子任务支持（通用�?===
  parentTaskId: string | null;

  // === 一次性任务专�?===
  startDate: TransferDate | null;
  dueDate: TransferDate | null;
  completedAt: TransferDate | null;
  estimatedMinutes: number | null;
  actualMinutes: number | null;
  note: string | null;

  // === 依赖关系（通用�?===
  dependencyStatus?: string; // 'NONE' | 'WAITING' | 'READY' | 'BLOCKED'
  isBlocked?: boolean;
  blockingReason: string | null;

  // === 其他 ===
  folderId: string | null;
  createdAt: TransferDate;
  updatedAt: TransferDate;
  deletedAt: TransferDate | null;
  history?: TaskTemplateHistoryServerDTO[];
  instances?: TaskInstanceServerDTO[]; // �?RECURRING 有实�?
}

/**
 * TaskTemplate Persistence DTO
 */
export interface TaskTemplatePersistenceDTO {
  id: string;
  identityId: string;
  name: string;
  description: string | null;
  taskType: string; // 'ONE_TIME' | 'RECURRING'

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
  timeConfig: TaskTimeConfigServer | null; // null for ONE_TIME tasks
  recurrenceRule: RecurrenceRuleServer | null;
  reminderConfig: TaskReminderConfigServer | null;
  importance: ImportanceLevel;
  goalBinding: TaskGoalBindingServer | null;
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

  // 实例生成
  generateInstances(fromDate: DomainDate, toDate: DomainDate): any[];
  getInstanceForDate(date: DomainDate): any | null;
  shouldGenerateInstance(date: DomainDate): boolean;

  // 状态管�?
  activate(): void;
  pause(): void;
  archive(): void;
  softDelete(): void;
  restore(): void;

  // 时间规则
  isActiveOnDate(date: DomainDate): boolean;
  getNextOccurrence(afterDate: DomainDate): DomainDate | null;

  // 提醒
  hasReminder(): boolean;
  getReminderTime(instanceDate: DomainDate): DomainDate | null;

  // 目标绑定
  bindToGoal(goalId: GoalId, keyResultId: KeyResultId, incrementValue: number): void;
  unbindFromGoal(): void;
  isLinkedToGoal(): boolean;

  // 历史记录
  addHistory(action: string, changes?: any): void;

  // 子实体管�?
  createInstance(params: any): TaskInstanceId;
  addInstance(instance: any): void;
  removeInstance(instanceId: TaskInstanceId): any | null;
  getInstance(instanceId: TaskInstanceId): any | null;
  getAllInstances(): any[];

  // DTO 转换
  toServerDTO(includeChildren?: boolean): TaskTemplateServerDTO;
  toClientDTO(includeChildren?: boolean): TaskTemplateClientDTO;
}
