/**
 * Reminder Template Aggregate Root - Client Interface
 * 提醒模板聚合?- 客户端接?
 */

import type {
  ReminderTemplateId,
  ReminderGroupId,
  IdentityId,
  TransferDate,
  DomainDate,
} from '../../../primitives';
import { ImportanceLevel } from '../../../shared/value-objects/importance';
import type { ReminderType } from '../value-objects/reminder-type';
import type { ReminderStatus } from '../value-objects/reminder-status';

// 从值对象导入类型
import type {
  NotificationConfigServerDTO,
  NotificationConfigClientDTO,
  NotificationConfigClient,
  TriggerConfigServerDTO,
  TriggerConfigClientDTO,
  TriggerConfigClient,
  ActiveTimeConfigServerDTO,
  ActiveTimeConfigClientDTO,
  ActiveTimeConfigClient,
  ActiveHoursConfigServerDTO,
  ActiveHoursConfigClientDTO,
  ActiveHoursConfigClient,
} from '../value-objects';
import type { ReminderHistoryClientDTO } from '../entities/reminder-history-client';

// ============ DTO 定义 ============

/**
 * Reminder Template Client DTO
 */
export interface ReminderTemplateClientDTO {
  id: ReminderTemplateId;
  identityId: IdentityId;
  name: string;
  description: string | null;
  type: ReminderType;
  trigger: TriggerConfigClientDTO;
  activeTime: ActiveTimeConfigClientDTO;
  activeHours: ActiveHoursConfigClientDTO | null;
  notificationConfig: NotificationConfigClientDTO;
  selfEnabled: boolean;
  status: ReminderStatus;
  effectiveEnabled: boolean; // 实际启用状态（计算得出?
  groupId: ReminderGroupId | null;
  importanceLevel: ImportanceLevel;
  tags: string[];
  color: string | null;
  icon: string | null;
  nextTriggerAt: TransferDate | null;
  version: number;
  createdAt: TransferDate;
  updatedAt: TransferDate;
  deletedAt: TransferDate | null;

  // ===== 子实?DTO =====
  history: ReminderHistoryClientDTO[] | null; // 提醒历史列表（可选加载）

  // UI 扩展
  displayTitle: string;
  typeText: string; // "一次? | "循环"
  triggerText: string; // "每天 09:00" | "每隔 30 分钟"
  statusText: string;
  importanceText: string;
  nextTriggerText: string | null; // "明天 09:00" | "10 分钟?
  isActive: boolean;
  isPaused: boolean;
  lastTriggeredText: string | null; // "3 小时?
  controlledByGroup: boolean; // 是否受组控制
}
