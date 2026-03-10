/**
 * Setting Module - Infrastructure Server
 *
 * Ports and Adapters for Setting module persistence.
 */

// DI Module
export { SettingModule } from './setting.module';
export { SettingContainer } from './di/setting-container';

// Ports (Interfaces)
export { type IUserSettingRepository } from '../domain-server';

// Prisma Adapters
export { UserSettingPrismaRepository } from './adapters/prisma';
export { UserSettingPowerSyncRepository } from './adapters/powersync/user-setting-powersync.repository';
