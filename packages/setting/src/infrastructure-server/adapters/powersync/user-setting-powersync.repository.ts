import type { IDomainEvent } from '@dailyuse/contracts/shared';
import type { SettingEventMap } from '@dailyuse/contracts/setting';
import type { IUserSettingRepository } from '../../../domain-server/repositories/i-user-setting-repository';
import { UserSetting } from '../../../domain-server/aggregates/user-setting';
import { eventBus } from '@dailyuse/utils';
import {
  PowerSyncUserSettingMapper,
  type PowerSyncUserSettingRow,
} from './mappers/powersync-user-setting.mapper';

type Queryable = {
  getOptional<T>(sql: string, parameters?: unknown[]): Promise<T | null>;
  execute(sql: string, parameters?: unknown[]): Promise<unknown>;
};

export class UserSettingPowerSyncRepository implements IUserSettingRepository {
  constructor(private readonly db: Queryable) {}

  async save(setting: UserSetting): Promise<void> {
    const data = PowerSyncUserSettingMapper.toPersistence(setting);

    const existing = await this.db.getOptional<{ identity_id: string }>(
      'SELECT identity_id FROM user_settings WHERE identity_id = ? LIMIT 1',
      [data.identityId],
    );

    if (existing) {
      await this.db.execute(
        `UPDATE user_settings
         SET preferences = ?,
             version = ?,
             updated_at = ?
         WHERE identity_id = ?`,
        [data.preferences, data.version, data.updatedAt, data.identityId],
      );
    } else {
      await this.db.execute(
        `INSERT INTO user_settings (id, identity_id, preferences, version, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [data.id, data.identityId, data.preferences, data.version, data.createdAt, data.updatedAt],
      );
    }

    this.publishDomainEvents(setting.pullDomainEvents());
  }

  async findByIdentityId(identityId: string): Promise<UserSetting | null> {
    const row = await this.db.getOptional<PowerSyncUserSettingRow>(
      'SELECT * FROM user_settings WHERE identity_id = ? LIMIT 1',
      [identityId],
    );

    if (!row) return null;
    return PowerSyncUserSettingMapper.toDomain(row);
  }

  async delete(identityId: string): Promise<void> {
    await this.db.execute('DELETE FROM user_settings WHERE identity_id = ?', [identityId]);
  }

  private publishDomainEvents(events: ReadonlyArray<IDomainEvent>): void {
    for (const event of events) {
      eventBus.send(
        event.eventType as keyof SettingEventMap,
        event.payload as SettingEventMap[keyof SettingEventMap],
      );
    }
  }
}
