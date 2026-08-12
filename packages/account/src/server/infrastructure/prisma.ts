/**
 * Account Prisma composition helpers.
 */

import type { PrismaClient } from '@memoflow/database';
// Structural cloud-auth shape (boundary: scope:account must not import scope:authentication libs directly)
export interface CloudAuthLike {
  revokeAllSessions(identityId: string): Promise<{ revokedSessions: number }>;
  deleteUserData?(identityId: string): Promise<{ deletedRecords: number }>;
}
import {
  createAccountModule,
  type AccountModuleInstance,
} from './account.module';
import { PrismaAccountRepository } from './adapters/prisma/account-prisma.repository';
import { PrismaAccountClosureOperationRepository } from './adapters/prisma/account-closure-operation-prisma.repository';
import { AccountClosureOutboxEventPublisher } from './adapters/outbox/account-closure-outbox-event-publisher';
import { PrismaCloudAuthRevocationAdapter } from './adapters/cloud-auth/cloud-auth-revocation.adapter';
import type {
  CloudAuthRevocationPort,
  AccountClosureEventPublisher,
  IAccountClosureOperationRepository,
} from '../index';
import {
  createAccountRuntimeContributions,
  type AccountRuntimeContributionsInput,
} from './runtime';
import { PrismaOperationAuditRepository } from '@memoflow/patterns/operations';

export interface CreateAccountPrismaModuleOptions {
  readonly runtimeContributions?: AccountRuntimeContributionsInput;
  readonly closureOperationRepository?: IAccountClosureOperationRepository;
  readonly revocationPort?: CloudAuthRevocationPort;
  readonly eventPublisher?: AccountClosureEventPublisher;
  readonly cloudAuth?: CloudAuthLike;
}

export function createAccountPrismaRepository(db: PrismaClient) {
  return new PrismaAccountRepository(db);
}

export function createAccountPrismaModule(
  db: PrismaClient,
  options: CreateAccountPrismaModuleOptions = {},
): AccountModuleInstance {
  const accountRepository = createAccountPrismaRepository(db);

  const closureOperationRepository =
    options.closureOperationRepository ?? new PrismaAccountClosureOperationRepository(db);
  const revocationPort =
    options.revocationPort ?? new PrismaCloudAuthRevocationAdapter(db, options.cloudAuth);
  const eventPublisher =
    options.eventPublisher ?? new AccountClosureOutboxEventPublisher(db);

  return createAccountModule({
    accountRepository,
    closureOperationRepository,
    revocationPort,
    eventPublisher,
    laneCapability: 'api',
    runtimeContributions: createAccountRuntimeContributions(
      accountRepository,
      options.runtimeContributions,
    ),
    auditRepository: new PrismaOperationAuditRepository(db),
  });
}
