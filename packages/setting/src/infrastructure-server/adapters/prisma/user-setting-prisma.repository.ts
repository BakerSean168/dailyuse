/**
 * UserSetting Prisma Repository
 *
 * Prisma implementation of IUserSettingRepository.
 */

import type { PrismaClient } from '@dailyuse/database';
import type { IUserSettingRepository } from '../../../../domain-server/repositories/IUserSettingRepository';
import { UserSetting } from '../../../../domain-server/aggregates/user-setting';

export class UserSettingPrismaRepository implements IUserSettingRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private toDomain(data: any): UserSetting {
    const entries: any[] = [];
    const excludedKeys = ['id', 'identityId', 'version', 'createdAt', 'updatedAt', 'deletedAt'];

    for (const key in data) {
      if (!excludedKeys.includes(key) && data[key] !== null) {
        entries.push({
          id: 'generated',
          key: key,
          value: data[key],
          updatedAt: data.updatedAt.getTime(),
        });
      }
    }

    return UserSetting.fromPersistenceDTO({
      id: data.id,
      identityId: data.identityId,
      entries: JSON.stringify(entries),
      version: data.version,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      deletedAt: data.deletedAt,
    });
  }

  private toPrisma(setting: UserSetting) {
    const dto = setting.toPersistenceDTO();
    const entries = JSON.parse(dto.entries);

    const flatData: any = {
      id: dto.id,
      identityId: dto.identityId,
      version: dto.version,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
      deletedAt: dto.deletedAt,
    };

    for (const entry of entries) {
      flatData[entry.key] = entry.value;
    }

    return flatData;
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
