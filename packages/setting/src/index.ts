/**
 * @memoflow/setting
 *
 * Setting module runtime root.
 *
 * Public setting contracts are centralized in `@memoflow/contracts/setting`.
 * Root exports are limited to the canonical server composition root.
 * Client / API / Electron seams use dedicated subpaths.
 */

export {
  createSettingModule,
  createSettingPowerSyncModule,
  createSettingPrismaModule,
  createSettingPrismaRepository,
  type SettingModuleDependencies,
  type SettingModuleInstance,
  type CreateSettingPrismaModuleOptions,
} from './server';
export type { SettingApplicationPort } from './server';
