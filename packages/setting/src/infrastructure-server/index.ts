/**
 * Setting Module - Infrastructure Server
 *
 * Ports and Adapters for Setting module persistence.
 */

// DI Module
export { SettingModule } from './setting.module';
export { SettingContainer } from './di/setting-container';

// DI Factory
export { SettingRepositoryFactory } from './di';

// Ports (Interfaces)
export { type IAppConfigRepository, type ISettingRepository, type IUserSettingRepository } from '../domain-server';

// Prisma Adapters
export {
  AppConfigPrismaRepository,
  SettingPrismaRepository,
  UserSettingPrismaRepository,
} from './adapters/prisma';

// SQLite Adapters
export {
  SqliteAppConfigRepository,
  SqliteSettingRepository,
  SqliteUserSettingRepository,
} from './adapters/sqlite';

// SQLite schema
export { SETTING_MODULE_SCHEMA } from './adapters/sqlite/schema';