/**
 * UserSetting Prisma Repository
 *
 * Prisma implementation of IUserSettingRepository.
 */

import type { PrismaClient, UserSetting as PrismaUserSetting } from '@dailyuse/database';
import type { IUserSettingRepository } from '@/domain-server/repositories/IUserSettingRepository';
import { UserSetting } from '@/domain-server/aggregates/user-setting';
import { PrismaUserSettingMapper } from '../../mappers/prisma-user-setting-mapper';

export class UserSettingPrismaRepository implements IUserSettingRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private toDomain(data: PrismaUserSetting): UserSetting {
    return PrismaUserSettingMapper.toDomain(data);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private toPrisma(setting: UserSetting): any {
    return PrismaUserSettingMapper.toPersistence(setting);
  }

  async save(setting: UserSetting): Promise<void> {
    const data = this.toPrisma(setting);
    await this.prisma.userSetting.upsert({
      where: { identityId: data.identityId },
      create: data,
      update: data,
    });
  }

  async findByIdentityId(identityId: string): Promise<UserSetting | null> {
    const data = await this.prisma.userSetting.findUnique({
      where: { identityId },
    });
    return data ? this.toDomain(data) : null;
  }

  async delete(identityId: string): Promise<void> {
    await this.prisma.userSetting.delete({
      where: { identityId },
    });
  }
}
