/**
 * Setting Module — Composition Root
 *
 * 组装仓储 → 用例，提供统一的模块入口。
 */

import type { PrismaClient } from '@dailyuse/database';
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
    dbConnection: PrismaClient | unknown,
  ) {
    // 1. Initialize Repositories
    const repositories = SettingRepositoryFactory.create(dataSourceType, dbConnection);

    // 2. Register in DI container
    const container = SettingContainer.getInstance();
    container.reset();
    container.setUserSettingRepository(repositories.userSettingRepository);

    this.userSettingRepository = container.getUserSettingRepository();

    // 3. Wire Use Cases
    this.getUserSetting = new GetUserSetting(this.userSettingRepository);
    this.updateUserSetting = new UpdateUserSetting(this.userSettingRepository);
    this.resetUserSetting = new ResetUserSetting(this.userSettingRepository);
    this.exportSettings = new ExportSettings(this.userSettingRepository);
    this.importSettings = new ImportSettings(this.userSettingRepository);
    this.getDefaultSettings = new GetDefaultSettings();
  }
}

