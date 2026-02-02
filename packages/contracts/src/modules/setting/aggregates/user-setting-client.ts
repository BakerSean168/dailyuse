/**
 * UserSetting Aggregate Root - Client Interface
 * 用户设置聚合�?- 客户端接�?
 */

import type { SettingId, IdentityId, TransferDate, DomainDate } from '@/primitives';
import type { UserSettingServerDTO } from './user-setting-server';
import type { SettingEntryClient } from '../entities';

// ============ aggregate interface============

export interface UserSettingClient {
  id: SettingId;
  identityId: IdentityId;
  
  entries: Map<string, SettingEntryClient>;

  createdAt: DomainDate;
  updatedAt: DomainDate;
}

// ============ DTO 定义 ============

/**
 * UserSetting Client DTO
 */
export interface UserSettingClientDTO {
  id: string;
  identityId: string;

  entries: string; // JSON stringified entries
  
  createdAt: TransferDate;
  updatedAt: TransferDate;
}


