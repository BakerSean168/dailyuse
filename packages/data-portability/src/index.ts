/**
 * @dailyuse/data-portability
 *
 * Data portability module runtime root.
 *
 * Public contracts are centralized in `@dailyuse/contracts/data-portability`.
 * Root exports are limited to the canonical server composition root.
 * Client / API / Electron seams use dedicated subpaths.
 */

export {
  createDataPortabilityModule,
  createDataPortabilityPrismaModule,
  createPowerSyncDataPortabilityModule,
  type DataPortabilityModuleDependencies,
  type DataPortabilityModuleInstance,
} from './server';
export type { DataPortabilityApplicationPort } from './server';
