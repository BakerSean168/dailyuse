/**
 * Reminder Template Aggregate Root - Server Interface
 * 提醒模板聚合根 - 服务端接口
 */

import type { DomainDate, IdentityId, ReminderTemplateId } from '@/primitives';
import { ImportanceLevel } from '@/shared/value-objects/importance';
import type {
  ReminderHistoryServerDTO,
} from '../entities/reminder-history-server';

// 从值对象导入类型
import type {
  ReminderType,
  ReminderStatus,
  RecurrenceConfigServer,
  RecurrenceConfigServerDTO,
  NotificationConfigServer,
  NotificationConfigServerDTO,
  TriggerConfigServer,
  TriggerConfigServerDTO,
  ActiveTimeConfigServer,
  ActiveTimeConfigServerDTO,
  ActiveHoursConfigServer,
  ActiveHoursConfigServerDTO,
  ReminderStatsServer,
  ReminderStatsServerDTO,
} from '../value-objects';

// ============ DTO 定义 ============

/**
 * Reminder Template Server DTO
 */
export interface ReminderTemplateServerDTO {
  id: ReminderTemplateId;
  identityId: string;
  name: string;
  description?: string | null;
  type: ReminderType;
  trigger: TriggerConfigServerDTO;
  recurrence?: RecurrenceConfigServerDTO | null;
  activeTime: ActiveTimeConfigServerDTO;
  activeHours?: ActiveHoursConfigServerDTO | null;
  notificationConfig: NotificationConfigServerDTO;
  selfEnabled: boolean;
  status: ReminderStatus;
  groupId?: string | null;
  importanceLevel: ImportanceLevel;
  tags: string[];
  color?: string | null;
  icon?: string | null;
  nextTriggerAt?: number | null; // epoch ms
  stats: ReminderStatsServerDTO;
  version: number;
  createdAt: number; // epoch ms
  updatedAt: number; // epoch ms
  deletedAt?: number | null; // epoch ms

  // ===== 子实体 DTO =====
  history?: ReminderHistoryServerDTO[] | null; // 提醒历史列表（可选加载）
}

/**
 * Reminder Template Persistence DTO (数据库映射)
 */
export interface ReminderTemplatePersistenceDTO {
  id: ReminderTemplateId;
  identityId: IdentityId;
  name: string;
  description?: string | null;
  type: ReminderType;
  trigger: string; // JSON string
  recurrence?: string | null; // JSON string
  activeTime: string; // JSON string
  activeHours?: string | null; // JSON string
  notificationConfig: string; // JSON string
  selfEnabled: boolean;
  status: ReminderStatus;
  groupId?: string | null;
  importanceLevel: ImportanceLevel;
  tags: string; // JSON string
  color?: string | null;
  icon?: string | null;
  nextTriggerAt?: Date | null;
  stats: string; // JSON string
  
  // Smart Frequency: Response Metrics（扁平化字段）
  clickRate?: number | null;
  ignoreRate?: number | null;
  avgResponseTime?: number | null;
  snoozeCount?: number;
  effectivenessScore?: number | null;
  sampleSize?: number;
  lastAnalysisTime?: Date | null;
  
  // Smart Frequency: Frequency Adjustment（扁平化字段）
  originalInterval?: number | null;
  adjustedInterval?: number | null;
  adjustmentReason?: string | null;
  adjustmentTime?: Date | null;
  isAutoAdjusted?: boolean;
  userConfirmed?: boolean;
  
  smartFrequencyEnabled?: boolean;
  
  version: number;
  createdAt: DomainDate;
  updatedAt: DomainDate;
  deletedAt?: DomainDate | null;
}
