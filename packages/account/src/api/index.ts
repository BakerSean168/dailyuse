/**
 * Account API Module
 *
 * Entry point for the Account API module. Exposes an ApiBootstrapper via register().
 */

export { AccountApiModule } from './module';
export { createAccountPrismaModule } from './prisma';
export type { CreateAccountPrismaModuleOptions } from './prisma';
export { PowerSyncAccountRepository } from '../infrastructure-server';
export type {
  AccountModuleInstance,
  AccountModuleDependencies,
  AccountApplicationPort,
} from '../infrastructure-server';

// Domain types for desktop authentication cluster
export { Account } from '../domain-server';
export type { IAccountRepository } from '../domain-server';
