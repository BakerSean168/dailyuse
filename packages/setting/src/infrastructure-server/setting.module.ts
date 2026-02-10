import type { PrismaClient } from '../generated/prisma/client';
import type Database from 'better-sqlite3';

import { SettingApplicationService } from '@dailyuse/setting/application-server';
import { SettingRepositoryFactory } from './di';

type BetterSQLiteDB = Database.Database;

type SettingRepositories = ReturnType<
  typeof SettingRepositoryFactory.createPrismaRepositories
>;

export class SettingModule {
  public readonly userSettingRepository: SettingRepositories['userSettingRepository'];
  public readonly settingService: SettingApplicationService;

  constructor(
    dataSourceType: 'prisma' | 'sqlite',
    dbConnection: PrismaClient | BetterSQLiteDB,
  ) {
    // 1. Initialize Repositories using Factory
    const repositories = SettingRepositoryFactory.create(dataSourceType, dbConnection);
    this.userSettingRepository = repositories.userSettingRepository;

    // 2. Initialize Services
    this.settingService = new SettingApplicationService(this.userSettingRepository);
  }
}

