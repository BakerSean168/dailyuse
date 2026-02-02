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
  createdAt: DomainDate;
  updatedAt: DomainDate;

}



// ============ DTO 定义 ============



/**
 * UserSetting Server DTO
 */
export interface UserSettingServerDTO {
  id: string;
  identityId: string;

  entries: string; // JSON stringified entries

  createdAt: TransferDate;
  updatedAt: TransferDate;
}

/**
 * UserSetting Persistence DTO
 */
export interface UserSettingPersistenceDTO {
  id: string;
  identityId: string;

  entries: string; // JSON stringified entries

  createdAt: PersistenceDate;
  updatedAt: PersistenceDate;
}
