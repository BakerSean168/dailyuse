/**
 * Account Prisma composition helpers.
 */

import type { PrismaClient } from '@dailyuse/database';
import {
  createAccountModule,
  type AccountModuleInstance,
} from './account.module';
import { PrismaAccountRepository } from './adapters/prisma/account-prisma.repository';
import {
  createAccountRuntimeContributions,
  type AccountRuntimeContributionsInput,
} from './runtime';

export interface CreateAccountPrismaModuleOptions {
  readonly runtimeContributions?: AccountRuntimeContributionsInput;
}

export function createAccountPrismaRepository(db: PrismaClient) {
  return new PrismaAccountRepository(db);
}

export function createAccountPrismaModule(
  db: PrismaClient,
  options: CreateAccountPrismaModuleOptions = {},
): AccountModuleInstance {
  const accountRepository = createAccountPrismaRepository(db);

  return createAccountModule({
    accountRepository,
    runtimeContributions: createAccountRuntimeContributions(
      accountRepository,
      options.runtimeContributions,
    ),
  });
}
