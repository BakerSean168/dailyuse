/**
 * Setting Module - Infrastructure Server
 *
 * Ports and Adapters for Setting module persistence.
 */

// Composition root
export {
  createSettingModule,
  createSettingUseCases,
  type SettingApplicationPort,
  type SettingModuleDependencies,
  type SettingModuleInstance,
  type SettingModuleRuntimeContribution,
  type SettingModuleUseCases,
} from './setting.module';

// Ports (Interfaces)
export { type IUserSettingRepository } from '../domain-server';

// Prisma Adapters
export { UserSettingPrismaRepository } from './adapters/prisma';
export { UserSettingPowerSyncRepository } from './adapters/powersync/user-setting-powersync.repository';
export { createSettingPowerSyncModule } from './powersync';
