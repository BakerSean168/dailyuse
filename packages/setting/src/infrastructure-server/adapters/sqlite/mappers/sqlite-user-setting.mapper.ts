import { UserPreferencesSchema } from '@dailyuse/contracts/setting';
import {
  UserSetting,
  type UserSettingState,
} from '../../../../domain-server/aggregates/user-setting';
import { SettingId } from '../../../../domain-shared/value-objects/setting-id';
import { IdentityId } from '@dailyuse/domain-shared/shared';

export interface SqliteUserSettingRow {
  id: string;
  identity_id: string;
  preferences: string;
  version: number;
  created_at: string;
  updated_at: string;
}

export class SqliteUserSettingMapper {
  static toDomain(row: SqliteUserSettingRow): UserSetting {
    const preferences = UserPreferencesSchema.parse(JSON.parse(row.preferences));

    const state: UserSettingState = {
      id: SettingId.of(row.id),
      identityId: IdentityId.of(row.identity_id),
      preferences,
      version: row.version,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };

    return UserSetting.load(state);
  }

  static toPersistence(setting: UserSetting) {
    return {
      id: setting.id,
      identityId: setting.identityId,
      preferences: JSON.stringify(setting.toPreferences()),
      version: setting.version,
    };
  }
}
