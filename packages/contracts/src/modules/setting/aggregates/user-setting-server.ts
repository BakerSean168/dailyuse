/**
 * UserSetting Aggregate Root - Server Interface
 */

import type { SettingId, IdentityId, TransferDate } from '../../../primitives';
import type { UserSettingPreferences } from '../preferences';

/**
 * UserSetting Server DTO — Complete user setting data
 *
 * Contains `preferences` as a typed JSONB object.
 */
export interface UserSettingServerDTO {
  id: SettingId;
  identityId: IdentityId;
  preferences: UserSettingPreferences;
  version: number;
  createdAt: TransferDate;
  updatedAt: TransferDate;
}
