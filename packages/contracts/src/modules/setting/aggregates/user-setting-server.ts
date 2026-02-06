/**
 * UserSetting Aggregate Root - Server Interface
 * 用户设置聚合�?- 服务端接�?
 */

import type { SettingId, IdentityId, TransferDate, DomainDate, PersistenceDate } from '@/primitives';
import type { SettingEntryServer } from '../entities';


// ============ aggregate interface============

export interface UserSettingServer {
  id: SettingId;
  identityId: IdentityId;
  entries: Map<string, SettingEntryServer>;
  version: number;
  createdAt: DomainDate;
  updatedAt: DomainDate;
  deletedAt: DomainDate | null;
}



// ============ DTO 定义 ============



/**
 * UserSetting Server DTO
 */
export interface UserSettingServerDTO {
  id: string;
  identityId: string;

  entries: string; // JSON stringified entries

  version: number;
  createdAt: TransferDate;
  updatedAt: TransferDate;
  deletedAt: TransferDate | null;
}

/**
 * UserSetting Persistence DTO
 */
export interface UserSettingPersistenceDTO {
  id: string;
  identityId: string;

  entries: string; // JSON stringified entries

  version: number;
  createdAt: PersistenceDate;
  updatedAt: PersistenceDate;
  deletedAt: PersistenceDate | null;
}
