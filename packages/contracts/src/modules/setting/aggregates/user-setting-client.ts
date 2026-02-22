/**
 * UserSetting Aggregate Root - Client Interface
 * 用户设置聚合?- 客户端接?
 */

import type { SettingId, IdentityId, TransferDate } from '@/primitives';
import type { UserSettingServerDTO } from './user-setting-server';

// ============ DTO 定义 ============

/**
 * UserSetting Client DTO
 */
export interface UserSettingClientDTO {
  id: SettingId;
  identityId: IdentityId;

  entries: string; // JSON stringified entries
  
  version: number;
  createdAt: TransferDate;
  updatedAt: TransferDate;
  deletedAt: TransferDate | null;
}
