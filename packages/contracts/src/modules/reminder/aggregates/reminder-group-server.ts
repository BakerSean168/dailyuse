/**
 * Reminder Group Aggregate Root - Server Interface
 * 提醒分组聚合根 - 服务端接口
 */

import type { ControlMode, ReminderStatus, GroupStatsServerDTO } from '../value-objects';
import type { DomainDate, IdentityId, PersistenceDate, TransferDate } from '../../../primitives';

export interface ReminderGroupServerDTO {
  // 基础属性
  id: string;
  identityId: string;
  name: string;
  description?: string | null;
  color?: string | null;
  icon?: string | null;
  controlMode: ControlMode;
  enabled: boolean;
  status: ReminderStatus;
  order: number;
  stats: GroupStatsServerDTO;

  version: number;
  createdAt: TransferDate;
  updatedAt: TransferDate;
  deletedAt?: TransferDate | null;
}

export interface ReminderGroupPersistenceDTO {
  // 基础属性
  id: string;
  identityId: string;
  name: string;
  description?: string | null;
  color?: string | null;
  icon?: string | null;
  controlMode: ControlMode;
  enabled: boolean;
  status: ReminderStatus;
  order: number;
  stats: GroupStatsServerDTO;
  version: number;
  createdAt: PersistenceDate;
  updatedAt: PersistenceDate;
  deletedAt?: PersistenceDate | null;
}
