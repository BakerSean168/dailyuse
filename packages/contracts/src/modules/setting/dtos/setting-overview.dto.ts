import type { UserSettingClientDTO } from '../aggregates';

export interface SettingOverviewDTO {
  readonly userSetting: UserSettingClientDTO;
  readonly lastSyncedAt: number | null;
}
