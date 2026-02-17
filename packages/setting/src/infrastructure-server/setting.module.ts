import type { PrismaClient } from '@dailyuse/database';
import type Database from 'better-sqlite3';
import type { IUserSettingRepository } from '../domain-server/repositories/IUserSettingRepository';

import {
  GetUserSetting,
  UpdateUserSetting,
  ResetUserSetting,
  ExportSettings,
  ImportSettings,
  GetDefaultSettings,
} from '../application-server';
import { SettingRepositoryFactory } from './di';
import { SettingContainer } from './di/setting-container';

type BetterSQLiteDB = Database.Database;

export class SettingModule {
  public readonly userSettingRepository: IUserSettingRepository;
  public readonly getUserSetting: GetUserSetting;
  public readonly updateUserSetting: UpdateUserSetting;
  public readonly resetUserSetting: ResetUserSetting;
  public readonly exportSettings: ExportSettings;
  public readonly importSettings: ImportSettings;
  public readonly getDefaultSettings: GetDefaultSettings;

  constructor(
    dataSourceType: 'prisma' | 'sqlite',
    dbConnection: PrismaClient | BetterSQLiteDB,
  ) {
    // 1. Initialize Repositories using Factory
    const repositories = SettingRepositoryFactory.create(dataSourceType, dbConnection);

    // 2. Register repositories in DI container
    const container = SettingContainer.getInstance();
    container.reset();
    container.setUserSettingRepository(repositories.userSettingRepository);

    this.userSettingRepository = container.getUserSettingRepository();

    // 3. Initialize Services
    this.getUserSetting = new GetUserSetting(this.userSettingRepository);
    this.updateUserSetting = new UpdateUserSetting(this.userSettingRepository);
    this.resetUserSetting = new ResetUserSetting(this.userSettingRepository);
    this.exportSettings = new ExportSettings(this.userSettingRepository);
    this.importSettings = new ImportSettings(this.userSettingRepository);
    this.getDefaultSettings = new GetDefaultSettings();
  }
}

