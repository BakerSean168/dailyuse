/**
 * UserSetting Aggregate Root - Client Interface
 */

import type { SettingId, IdentityId, TransferDate } from '@/primitives';
import type { UserSettingPreferences } from '../preferences';

/**
 * UserSetting Client DTO — User settings sent to client
 */
export interface UserSettingClientDTO {
  id: SettingId;
  identityId: IdentityId;
  preferences: UserSettingPreferences;
  version: number;
  createdAt: TransferDate;
  updatedAt: TransferDate;
}
