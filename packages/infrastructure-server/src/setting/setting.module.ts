import { PrismaClient } from '@prisma/client';
import { PrismaUserSettingRepository } from './repositories/prisma-user-setting-repository';
import { SettingApplicationService } from '@dailyuse/application-server/setting';

export class SettingModule {
  public readonly userSettingRepository: PrismaUserSettingRepository;
  public readonly settingService: SettingApplicationService;

  constructor(prisma: PrismaClient) {
    this.userSettingRepository = new PrismaUserSettingRepository(prisma);
    this.settingService = new SettingApplicationService(this.userSettingRepository);
  }
}
