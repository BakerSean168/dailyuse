/**
 * @memoflow/account
 *
 * Account module runtime root.
 *
 * Public account contracts are centralized in `@memoflow/contracts/account`.
 * Root exports are limited to the canonical server composition root.
 * Client / API / Electron seams use dedicated subpaths.
 */

export {
  createAccountModule,
  createAccountPowerSyncModule,
  createAccountPrismaModule,
  createAccountPrismaRepository,
  createCloudAccountProvisioner,
  type AccountModuleDependencies,
  type AccountModuleInstance,
  type CreateAccountPowerSyncModuleOptions,
  type CreateAccountPrismaModuleOptions,
  type CloudAccountProvisioningInput,
} from './server';
export type { AccountApplicationPort } from './server';
