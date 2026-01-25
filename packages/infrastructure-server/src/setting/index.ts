/**
 * Setting Module - Infrastructure Server
 *
 * Ports and Adapters for Setting module persistence.
 */

// DI Module
export { SettingModule } from './setting.module';

// DI Factory
export { SettingRepositoryFactory } from './di';

// Ports (Interfaces)
export { type IAppConfigRepository } from './ports/app-config-repository.port';
export { type ISettingRepository } from './ports/setting-repository.port';
export { type IUserSettingRepository } from './ports/user-setting-repository.port';

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