/**
 * TaskTemplate Aggregate Root - Server Interface
 * 任务模板聚合根
 */

import type { TaskType, TaskTemplateStatus } from '../enums';
import type { TaskInstanceServerDTO } from './TaskInstanceServer';
import type { TaskTemplateHistoryServerDTO } from '../entities';
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
 * TaskTemplate Client DTO (声明，实际定义在 Client 文件)
 */
export interface TaskTemplateClientDTO {
  uuid: string;
  accountUuid: string;
  title: string;
  description?: string | null;
  taskType: TaskType;
  timeConfig: TaskTimeConfigClientDTO;
  recurrenceRule?: RecurrenceRuleClientDTO | null;
  reminderConfig?: TaskReminderConfigClientDTO | null;
  importance: ImportanceLevel;
  goalBinding?: TaskGoalBindingClientDTO | null;
  folderUuid?: string | null;
  tags: string[];
  color?: string | null;
  status: TaskTemplateStatus;
  lastGeneratedDate?: number | null;
  generateAheadDays: number | null; // null for ONE_TIME tasks
  createdAt: number;
  updatedAt: number;
  deletedAt?: number | null;
  history?: any[];
  instances?: any[];
  displayTitle: string;
  taskTypeText: string;
  timeDisplayText: string | null; // null for ONE_TIME tasks
  recurrenceText?: string | null;
  importanceText: string;
  statusText: string;
  hasReminder: boolean;
  reminderText?: string | null;
  isLinkedToGoal: boolean;
  goalLinkText?: string | null;
  instanceCount: number;
  completedInstanceCount: number;
  pendingInstanceCount: number;
  completionRate: number;
  formattedCreatedAt: string;
  formattedUpdatedAt: string;
}

/**
 * TaskTemplate Server DTO
 */
export interface TaskTemplateServerDTO {
  uuid: string;
  accountUuid: string;
  title: string;
  description?: string | null;
  taskType: TaskType; // 'ONE_TIME' | 'RECURRING'
  
  // === 循环任务专用 ===
  timeConfig?: TaskTimeConfigServerDTO | null;
  recurrenceRule?: RecurrenceRuleServerDTO | null;
  reminderConfig?: TaskReminderConfigServerDTO | null;
  lastGeneratedDate?: number | null;
  generateAheadDays?: number | null;
  
  // === 通用属性 ===
  importance: ImportanceLevel;
  /**
   * 优先级分数 (0-100)
   * 由系统根据 importance + dueDate 动态计算
   * @readonly 此字段不能直接修改，计算由 Application Layer 负责
   * @computed 基于 Story 1.3 算法计算得出
   */
  priority?: number;
  tags: string[];
  color?: string | null;
  status: TaskTemplateStatus;
  
  // === Goal/KR 关联（通用） ===
  goalUuid?: string | null;
  keyResultUuid?: string | null;
  goalBinding?: TaskGoalBindingServerDTO | null; // 仅循环任务使用的高级绑定
  
  // === 子任务支持（通用） ===
  parentTaskUuid?: string | null;
  
  // === 一次性任务专用 ===
  startDate?: number | null; // Unix timestamp (ms)
  dueDate?: number | null; // Unix timestamp (ms)
  completedAt?: number | null; // Unix timestamp (ms)
  estimatedMinutes?: number | null;
  actualMinutes?: number | null;
  note?: string | null;
  
  // === 依赖关系（通用） ===
  dependencyStatus?: string; // 'NONE' | 'WAITING' | 'READY' | 'BLOCKED'
  isBlocked?: boolean;
  blockingReason?: string | null;
  
  // === 其他 ===
  folderUuid?: string | null;
  createdAt: number;
  updatedAt: number;
  deletedAt?: number | null;
  history?: TaskTemplateHistoryServerDTO[];
  instances?: TaskInstanceServerDTO[]; // 仅 RECURRING 有实例
}

/**
 * TaskTemplate Persistence DTO
 */
export interface TaskTemplatePersistenceDTO {
  uuid: string;
  accountUuid: string;
  title: string;
  description?: string | null;
  taskType: string; // 'ONE_TIME' | 'RECURRING'

  // === 循环任务专用 ===
  // Flattened timeConfig
  timeConfigType?: string | null;
  timeConfigStartTime?: number | null;
  timeConfigEndTime?: number | null;
  timeConfigDurationMinutes?: number | null;

  // Flattened recurrence_rule
  recurrenceRuleType?: string | null;
  recurrenceRuleInterval?: number | null;
  recurrenceRuleDaysOfWeek?: string | null; // JSON array
  recurrenceRuleDayOfMonth?: number | null;
  recurrenceRuleMonthOfYear?: number | null;
  recurrenceRuleEndDate?: number | null;
  recurrenceRuleCount?: number | null;

  // Flattened reminderConfig
  reminderConfigEnabled?: boolean | null;
  reminderConfigTimeOffsetMinutes?: number | null;
  reminderConfigUnit?: string | null;
  reminderConfigChannel?: string | null;

  lastGeneratedDate?: number | null;
  generateAheadDays?: number | null;

  // === 通用属性 ===
  importance: string; // 'vital' | 'important' | 'moderate' | 'minor' | 'trivial'
  tags: string; // JSON array
  color?: string | null;
  status: string;

  // === Goal/KR 关联（通用） ===
  goalUuid?: string | null;
  keyResultUuid?: string | null;

  // Flattened goal_binding (仅循环任务高级绑定)
  goalBindingGoalUuid?: string | null;
  goalBindingKeyResultUuid?: string | null;
  goalBindingIncrementValue?: number | null;

  // === 子任务支持（通用） ===
  parentTaskUuid?: string | null;

  // === 一次性任务专用 ===
  startDate?: number | null; // BigInt in Prisma
  dueDate?: number | null; // BigInt in Prisma
  completedAt?: number | null; // BigInt in Prisma
  estimatedMinutes?: number | null;
  actualMinutes?: number | null;
  note?: string | null;

  // === 依赖关系（通用） ===
  dependencyStatus?: string; // 'NONE' | 'WAITING' | 'READY' | 'BLOCKED'
  isBlocked?: boolean;
  blockingReason?: string | null;

  // === 其他 ===
  folderUuid?: string | null;
  createdAt: number;
  updatedAt: number;
  deletedAt?: number | null;
}

// ============ 聚合根接口 ============

export interface TaskTemplateServer {
  uuid: string;
  accountUuid: string;
  title: string;
  description?: string | null;
  taskType: TaskType;
  timeConfig: TaskTimeConfigServer | null; // null for ONE_TIME tasks
  recurrenceRule?: RecurrenceRuleServer | null;
  reminderConfig?: TaskReminderConfigServer | null;
  importance: ImportanceLevel;
  goalBinding?: TaskGoalBindingServer | null;
  folderUuid?: string | null;
  tags: string[];
  color?: string | null;
  status: TaskTemplateStatus;
  lastGeneratedDate?: number | null;
  generateAheadDays: number | null; // null for ONE_TIME tasks
  createdAt: number;
  updatedAt: number;
  deletedAt?: number | null;
  history: TaskTemplateHistoryServerDTO[];
  instances: TaskInstanceServerDTO[];

  // 实例生成
  generateInstances(fromDate: number, toDate: number): any[];
  getInstanceForDate(date: number): any | null;
  shouldGenerateInstance(date: number): boolean;

  // 状态管理
  activate(): void;
  pause(): void;
  archive(): void;
  softDelete(): void;
  restore(): void;

  // 时间规则
  isActiveOnDate(date: number): boolean;
  getNextOccurrence(afterDate: number): number | null;

  // 提醒
  hasReminder(): boolean;
  getReminderTime(instanceDate: number): number | null;

  // 目标绑定
  bindToGoal(goalUuid: string, keyResultUuid: string, incrementValue: number): void;
  unbindFromGoal(): void;
  isLinkedToGoal(): boolean;

  // 历史记录
  addHistory(action: string, changes?: any): void;

  // 子实体管理
  createInstance(params: any): string;
  addInstance(instance: any): void;
  removeInstance(instanceUuid: string): any | null;
  getInstance(instanceUuid: string): any | null;
  getAllInstances(): any[];

  // DTO 转换
  toServerDTO(includeChildren?: boolean): TaskTemplateServerDTO;
  toClientDTO(includeChildren?: boolean): TaskTemplateClientDTO;
  toPersistenceDTO(): TaskTemplatePersistenceDTO;
}
