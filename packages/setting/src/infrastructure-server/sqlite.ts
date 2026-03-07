/**
 * Setting Module - SQLite Composition Root
 */

import type Database from 'better-sqlite3';
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
import { SqliteUserSettingRepository } from './adapters/sqlite';

type BetterSQLiteDB = Database.Database;

export class SettingSqliteModule {
  public readonly userSettingRepository: IUserSettingRepository;
  public readonly getUserSetting: GetUserSetting;
  public readonly patchUserSetting: PatchUserSetting;
  public readonly resetUserSetting: ResetUserSetting;
  public readonly exportSettings: ExportSettings;
  public readonly importSettings: ImportSettings;
  public readonly getDefaultSettings: GetDefaultSettings;

  constructor(dbConnection: BetterSQLiteDB) {
    const userSettingRepository = new SqliteUserSettingRepository(dbConnection);

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

export { SqliteUserSettingRepository, SettingContainer };
