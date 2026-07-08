import { UserPreferencesSchema } from '@dailyuse/contracts/setting';
import {
  UserSetting,
  type UserSettingState,
} from '../../../../domain/aggregates/user-setting';
import { SettingId } from '../../../../domain/value-objects/setting-id';
import { IdentityId } from '@dailyuse/domain-shared/shared';

export type PowerSyncUserSettingRow = {
  id: string;
  identity_id: string;
  preferences: string;
  version: number;
  created_at: string;
  updated_at: string;
};

export class PowerSyncUserSettingMapper {
  static toDomain(data: PowerSyncUserSettingRow): UserSetting {
    const state: UserSettingState = {
      id: SettingId.of(data.id),
      identityId: IdentityId.of(data.identity_id),
      preferences: UserPreferencesSchema.parse(JSON.parse(data.preferences) as unknown),
      version: Number(data.version),
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };

    return UserSetting.load(state);
  }

  static toPersistence(setting: UserSetting): {
    id: string;
    identityId: string;
    preferences: string;
    version: number;
    createdAt: string;
    updatedAt: string;
  } {
    return {
      id: String(setting.id),
      identityId: String(setting.identityId),
      preferences: JSON.stringify(setting.toPreferences()),
      version: setting.version,
      createdAt: setting.createdAt.toISOString(),
      updatedAt: setting.updatedAt.toISOString(),
    };
  }
}
