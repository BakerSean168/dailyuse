import type {  PrismaClient  } from "@prisma/client";
import { SettingApplicationService } from '@dailyuse/application-server';
import { UserSettingPrismaRepository } from './adapters/prisma/user-setting-prisma.repository';

export class SettingModule {
  public readonly userSettingRepository: UserSettingPrismaRepository;
  public readonly settingService: SettingApplicationService;

  constructor(prisma: PrismaClient) {
    this.userSettingRepository = new UserSettingPrismaRepository(prisma);
    this.settingService = new SettingApplicationService(this.userSettingRepository);
  }
}

