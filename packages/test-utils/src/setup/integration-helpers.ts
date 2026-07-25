/**
 * Residual 1043: sole integration helpers for domain package integration tests.
 * getPrisma / disconnectPrisma / cleanAll / seedAccount duals retired from
 * goal/schedule/reminder/task __tests__/integration-helpers.ts.
 */
import type { Prisma, PrismaClient } from '@dailyuse/database';
import { IdentityId } from '@dailyuse/domain-shared';
import { cleanAllTables } from './database';

let prismaPromise: Promise<PrismaClient> | null = null;
type AccountJsonInput = Prisma.AccountUncheckedCreateInput['profile'];

export async function getPrisma(): Promise<PrismaClient> {
  if (!prismaPromise) {
    prismaPromise = import('@dailyuse/database').then((module) => module.prisma);
  }
  return prismaPromise;
}

export async function disconnectPrisma(): Promise<void> {
  const prisma = await getPrisma();
  await prisma.$disconnect();
  prismaPromise = null;
}

export async function cleanAll(): Promise<void> {
  const prisma = await getPrisma();
  await cleanAllTables(prisma);
}

export async function seedAccount(
  overrides: {
    id?: string;
    emailAddress?: string;
    profile?: AccountJsonInput | Record<string, unknown>;
    settings?: AccountJsonInput | Record<string, unknown>;
    status?: string;
    /** Default email local-part prefix when emailAddress is omitted. */
    emailPrefix?: string;
  } = {},
) {
  const prisma = await getPrisma();
  const id = overrides.id ?? IdentityId.generate();
  const emailAddress =
    overrides.emailAddress ??
    `${overrides.emailPrefix ?? 'int'}-${id.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()}@example.test`;

  await prisma.authIdentity.upsert({
    where: { id },
    update: {
      status: 'Unverified',
      failedLoginAttempts: 0,
      lastFailedAttempt: null,
      lockedUntil: null,
      deletedAt: null,
    },
    create: {
      id,
      status: 'Unverified',
    },
  });

  return prisma.account.upsert({
    where: { id },
    update: {
      status: overrides.status ?? 'ACTIVE',
      profile: (overrides.profile ?? {}) as AccountJsonInput,
      settings: (overrides.settings ?? {}) as AccountJsonInput,
      emailAddress,
      emailIsVerified: true,
      emailVerifiedAt: new Date(),
      emailIsPrimary: true,
      deletedAt: null,
    },
    create: {
      id,
      status: overrides.status ?? 'ACTIVE',
      profile: (overrides.profile ?? {}) as AccountJsonInput,
      settings: (overrides.settings ?? {}) as AccountJsonInput,
      emailAddress,
      emailIsVerified: true,
      emailVerifiedAt: new Date(),
      emailIsPrimary: true,
    },
  });
}
