import type { IUserSettingRepository } from '../domain-server/repositories/IUserSettingRepository';
import { createSettingModule, type SettingModuleInstance } from './setting.module';
import { UserSettingPowerSyncRepository } from './adapters/powersync/user-setting-powersync.repository';

type Queryable = {
  getOptional<T>(sql: string, parameters?: unknown[]): Promise<T | null>;
  execute(sql: string, parameters?: unknown[]): Promise<unknown>;
};

export function createSettingPowerSyncModule(dbConnection: Queryable): SettingModuleInstance {
  return createSettingModule({
    userSettingRepository: new UserSettingPowerSyncRepository(
      dbConnection,
    ) as IUserSettingRepository,
    persistMissingSettingOnRead: false,
  });
}

export { UserSettingPowerSyncRepository };
