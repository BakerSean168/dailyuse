/**
 * Account Prisma Composition Helpers
 *
 * Public-facing convenience factories for composing the account module
 * with Prisma-backed repositories.
 */

import type { PrismaClient } from '@dailyuse/database';
import {
  createAccountModule,
  PrismaAccountRepository,
  type AccountModuleInstance,
  type AccountModuleRuntimeContribution,
} from '../infrastructure-server';

export interface CreateAccountPrismaModuleOptions {
  readonly runtimeContributions?:
    | AccountModuleRuntimeContribution
    | readonly AccountModuleRuntimeContribution[];
}

/**
 * Create a fully-wired account module backed by Prisma repositories.
 */
export function createAccountPrismaModule(
  db: PrismaClient,
  options: CreateAccountPrismaModuleOptions = {},
): AccountModuleInstance {
  return createAccountModule({
    accountRepository: new PrismaAccountRepository(db),
    runtimeContributions: options.runtimeContributions,
  });
}
