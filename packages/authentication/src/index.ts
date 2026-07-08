/**
 * @dailyuse/authentication
 *
 * Public authentication contracts stay centralized in
 * `@dailyuse/contracts/authentication`.
 * Root exports are limited to the canonical server composition roots.
 * Client / API / Electron seams use dedicated subpaths.
 */

export {
  createAuthenticationModule,
  createAuthenticationPrismaModule,
  createAuthenticationPowerSyncModule,
  createAuthenticationRuntimeContribution,
  type AuthenticationModuleDependencies,
  type AuthenticationModuleInstance,
  type CreateAuthenticationPrismaModuleOptions,
} from './server';
export type { AuthenticationApplicationPort } from './server';
