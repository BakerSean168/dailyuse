import type { UserSettingClientDTO } from '../aggregates/user-setting-client';

export interface SettingOverviewDTO {
  readonly userSetting: UserSettingClientDTO;
  readonly lastSyncedAt: number | null;
}
