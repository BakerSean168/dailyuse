/**
 * @dailyuse/account
 *
 * Account module runtime root.
 *
 * Public account contracts are centralized in `@dailyuse/contracts/account`.
 * Root exports are limited to the canonical server composition root.
 * Client / API / Electron seams use dedicated subpaths.
 */

export {
  createAccountModule,
  createAccountPowerSyncModule,
  createAccountPrismaModule,
  createAccountPrismaRepository,
  type AccountModuleDependencies,
  type AccountModuleInstance,
  type CreateAccountPowerSyncModuleOptions,
  type CreateAccountPrismaModuleOptions,
} from './server';
export type { AccountApplicationPort } from './server';
