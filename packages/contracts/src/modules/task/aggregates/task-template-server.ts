/**
 * TaskTemplate Aggregate Root - Server Interface
 * 任务模板聚合�?
 */

import type {
  TaskTemplateId,
  IdentityId,
  TaskFolderId,
  DomainDate,
  TransferDate,
  PersistenceDate,
} from '@/primitives';
import type { TaskTemplateStatus } from '../value-objects/task-template-status';
import type { TaskInstanceServerDTO } from './task-instance-server';
import type {
  TaskTimeConfig,
  TaskTimeConfigDTO,
  RecurrenceRule,
  RecurrenceRuleDTO,
  TaskReminderConfig,
  TaskReminderConfigDTO,
  TaskGoalBinding,
  TaskGoalBindingDTO,
  ChecklistItemDefinition, 
  ChecklistItemDefinitionDTO,
} from '../value-objects';

// 导入共享类型
import { ImportanceLevel } from '../../../shared/value-objects/importance';

// ============ DTO 定义 ============

/**
 * TaskTemplate Server DTO
 */
export interface TaskTemplateServerDTO {
  id: string;
  identityId: string;
  name: string;
  description: string | null;

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
  checklist: ChecklistItemDefinitionDTO[]; // To be defined later

  dependencyStatus?: string; // 'NONE' | 'WAITING' | 'READY' | 'BLOCKED'
  isBlocked?: boolean;
  blockingReason: string | null;

  // === 其他 ===
  folderId: string | null;
  version: number;
  createdAt: TransferDate;
  updatedAt: TransferDate;
  deletedAt: TransferDate | null;
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

  importance: string; // 'vital' | 'important' | 'moderate' | 'minor' | 'trivial'
  tags: string; // JSON array
  color: string | null;
  status: string;

  goalBinding: TaskGoalBindingDTO | null;

  parentTaskId: string | null;

  dependencyStatus?: string; // 'NONE' | 'WAITING' | 'READY' | 'BLOCKED'
  isBlocked?: boolean;
  blockingReason: string | null;

  // === 其他 ===
  folderId: string | null;  version: number;  createdAt: PersistenceDate;
  updatedAt: PersistenceDate;
  deletedAt: PersistenceDate | null;
}

// ============ 聚合根接�?============

export interface TaskTemplateServer {
  id: TaskTemplateId;
  identityId: IdentityId;

  name: string;
  description: string | null;
  timeConfig: TaskTimeConfig | null; // null for ONE_TIME tasks
  recurrenceRule: RecurrenceRule | null;
  reminderConfig: TaskReminderConfig | null;
  importance: ImportanceLevel;

  goalBinding: TaskGoalBinding | null;
  checklist: ChecklistItemDefinition[];

  folderId: TaskFolderId | null;
  tags: string[];
  color: string | null;
  status: TaskTemplateStatus;
  lastGeneratedDate: DomainDate | null;
  generateAheadDays: number | null; // null for ONE_TIME tasks
  version: number;
  createdAt: DomainDate;
  updatedAt: DomainDate;
  deletedAt: DomainDate | null;
}
