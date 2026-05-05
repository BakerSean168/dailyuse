/**
 * Reminder Group Aggregate Root - Client Interface
 * 提醒分组聚合?- 客户端接?
 */

import type { ReminderGroupId, IdentityId, TransferDate, DomainDate } from '../../../primitives';
import type { ControlMode } from '../value-objects/control-mode';
import type { ReminderStatus } from '../value-objects/reminder-status';
import type { GroupStatsDTO } from '../value-objects';

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
  stats: GroupStatsDTO;
  version: number;
  createdAt: TransferDate;
  updatedAt: TransferDate;
  deletedAt: TransferDate | null;
}
