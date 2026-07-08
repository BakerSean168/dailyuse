/**
 * Setting server infrastructure layer.
 */

export {
  createSettingModule,
  createSettingUseCases,
  type SettingModuleDependencies,
  type SettingModuleInstance,
  type SettingModuleRuntimeContribution,
  type SettingModuleUseCases,
} from './setting.module';
export type { SettingApplicationPort } from '../application';
export type { IUserSettingRepository } from '../domain';

export { UserSettingPrismaRepository } from './adapters/prisma';
export { UserSettingPowerSyncRepository } from './adapters/powersync/user-setting-powersync.repository';
export {
  createSettingPrismaModule,
  createSettingPrismaRepository,
  type CreateSettingPrismaModuleOptions,
} from './prisma';
export { createSettingPowerSyncModule } from './powersync';
export {
  createSettingRuntimeContribution,
  type SettingRuntimeContribution,
} from './runtime';
