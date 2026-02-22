/**
 * Reminder Group Aggregate Root - Client Interface
 * 提醒分组聚合?- 客户端接?
 */

import type {
  ReminderGroupId,
  IdentityId,
  TransferDate,
  DomainDate,
} from '@/primitives';
import type { ControlMode } from '../value-objects/control-mode';
import type { ReminderStatus } from '../value-objects/reminder-status';
import type { GroupStatsClientDTO } from '../value-objects';

// ============ DTO 定义 ============

/**
 * Reminder Group Client DTO
 */
export interface ReminderGroupClientDTO {
  id: ReminderGroupId;
  identityId: IdentityId;
  name: string;
  description: string | null;
  color: string | null;
  icon: string | null;
  controlMode: ControlMode;
  enabled: boolean;
  status: ReminderStatus;
  order: number;
  stats: GroupStatsClientDTO;
  version: number;
  createdAt: TransferDate;
  updatedAt: TransferDate;
  deletedAt: TransferDate | null;

  // UI 扩展
  displayName: string;
  controlModeText: string; // "组控? | "个体控制"
  statusText: string;
  templateCountText: string; // "5 个提?
  activeStatusText: string; // "3 个活?
  controlDescription: string; // "所有提醒统一启用" | "提醒独立控制"
}

/**
 * Reminder Group Client 静态工厂方法接?
 */
