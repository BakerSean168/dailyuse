/**
 * Prisma UserSetting Mapper
 *
 * Maps between UserSetting domain aggregate and Prisma JSONB model.
 * Uses UserPreferencesSchema.parse() to validate and fill defaults.
 */

import type { UserSetting as PrismaUserSetting } from '@dailyuse/database';
import {
  UserSetting,
  type UserSettingState,
} from '../../../../domain-server/aggregates/user-setting';
import { SettingId } from '../../../../domain-shared/value-objects/setting-id';
import { IdentityId } from '@dailyuse/domain-shared/shared';
import { UserPreferencesSchema } from '@dailyuse/contracts/setting';

export class PrismaUserSettingMapper {
  /**
   * Prisma �?Domain
   */
  static toDomain(data: PrismaUserSetting): UserSetting {
    const preferences = UserPreferencesSchema.parse((data as { preferences: unknown }).preferences);

    const state: UserSettingState = {
      id: SettingId.of(data.id),
      identityId: IdentityId.of(data.identityId),
      preferences,
      version: data.version,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };

    return UserSetting.load(state);
  }

  /**
   * Domain �?Prisma write data
   */
  static toPersistence(setting: UserSetting): Record<string, unknown> {
    return {
      id: setting.id,
      identityId: setting.identityId,
      preferences: setting.toPreferences(),
      version: setting.version,
      createdAt: setting.createdAt,
      updatedAt: setting.updatedAt,
    };
  }
}
