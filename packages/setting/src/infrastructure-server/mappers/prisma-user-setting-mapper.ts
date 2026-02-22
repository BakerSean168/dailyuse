/**
 * Prisma UserSetting Mapper
 *
 * Maps between UserSetting domain aggregate and Prisma model.
 * Handles flat column → entries JSON conversion (Prisma stores individual
 * setting columns; domain stores a JSON entries array).
 */

import type { UserSetting as PrismaUserSetting } from '@dailyuse/database';
import { UserSetting } from '@/domain-server/aggregates/user-setting';

export class PrismaUserSettingMapper {
  /**
   * Prisma UserSetting → Domain UserSetting aggregate.
   * Iterates over Prisma columns and packs non-meta fields into entries JSON.
   */
  static toDomain(data: PrismaUserSetting): UserSetting {
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

  /**
   * Domain UserSetting → Prisma write data.
   * Unpacks entries JSON into flat columns.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static toPersistence(setting: UserSetting): any {
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
    for (const entry of entries as any[]) {
      flatData[entry.key] = entry.value;
    }

    return flatData;
  }
}
