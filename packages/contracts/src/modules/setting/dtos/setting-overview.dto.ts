import type { UserSettingClientDTO, AppConfigClientDTO } from '../aggregates';

export interface SettingOverviewDTO {
  readonly userSetting: UserSettingClientDTO;
  readonly appConfig: AppConfigClientDTO;
  readonly lastSyncedAt: number | null;
}
