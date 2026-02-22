/**
 * UserSetting Prisma Repository
 *
 * Prisma implementation of IUserSettingRepository.
 */

import type { PrismaClient, UserSetting as PrismaUserSetting } from '@dailyuse/database';
import type { IUserSettingRepository } from '@/domain-server/repositories/IUserSettingRepository';
import { UserSetting } from '@/domain-server/aggregates/user-setting';

export class UserSettingPrismaRepository implements IUserSettingRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private toDomain(data: PrismaUserSetting): UserSetting {
    const entries: any[] = [];
    const excludedKeys = ['id', 'identityId', 'version', 'createdAt', 'updatedAt', 'deletedAt'];
    const record = data as unknown as Record<string, unknown>;

    for (const key in record) {
      if (!excludedKeys.includes(key) && record[key] !== null) {
        entries.push({
          id: 'generated',
          key: key,
          value: record[key],
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private toPrisma(setting: UserSetting): any {
    const dto = setting.toPersistenceDTO();
    const entries = JSON.parse(dto.entries);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const flatData: any = {
      id: dto.id,
      identityId: dto.identityId,
      version: dto.version,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
      deletedAt: dto.deletedAt,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
