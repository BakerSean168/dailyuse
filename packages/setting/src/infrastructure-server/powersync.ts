import type { IUserSettingRepository } from '../domain-server/repositories/IUserSettingRepository';
import {
  GetUserSetting,
  PatchUserSetting,
  ResetUserSetting,
  ExportSettings,
  ImportSettings,
  GetDefaultSettings,
} from '../application-server';
import { SettingContainer } from './di/setting-container';
import { UserSettingPowerSyncRepository } from './adapters/powersync/user-setting-powersync.repository';

type Queryable = {
  getOptional<T>(sql: string, parameters?: unknown[]): Promise<T | null>;
  execute(sql: string, parameters?: unknown[]): Promise<unknown>;
};

export class SettingPowerSyncModule {
  public readonly userSettingRepository: IUserSettingRepository;
  public readonly getUserSetting: GetUserSetting;
  public readonly patchUserSetting: PatchUserSetting;
  public readonly resetUserSetting: ResetUserSetting;
  public readonly exportSettings: ExportSettings;
  public readonly importSettings: ImportSettings;
  public readonly getDefaultSettings: GetDefaultSettings;

  constructor(dbConnection: Queryable) {
    const userSettingRepository = new UserSettingPowerSyncRepository(dbConnection);

    const container = SettingContainer.getInstance();
    container.reset();
    container.setUserSettingRepository(userSettingRepository);

    this.userSettingRepository = container.getUserSettingRepository();

    this.getUserSetting = new GetUserSetting(this.userSettingRepository);
    this.patchUserSetting = new PatchUserSetting(this.userSettingRepository);
    this.resetUserSetting = new ResetUserSetting(this.userSettingRepository);
    this.exportSettings = new ExportSettings(this.userSettingRepository);
    this.importSettings = new ImportSettings(this.userSettingRepository);
    this.getDefaultSettings = new GetDefaultSettings();
  }
}

export { UserSettingPowerSyncRepository, SettingContainer };
