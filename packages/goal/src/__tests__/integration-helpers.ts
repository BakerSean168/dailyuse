import type { PrismaClient } from '@dailyuse/database';
import { IdentityId } from '@dailyuse/domain-shared';
import { cleanAllTables } from '@dailyuse/test-utils/setup/database';

let prismaPromise: Promise<PrismaClient> | null = null;

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
    profile?: Record<string, unknown>;
    settings?: Record<string, unknown>;
    status?: string;
  } = {},
) {
  const prisma = await getPrisma();
  const id = overrides.id ?? IdentityId.generate();
  const emailAddress =
    overrides.emailAddress ??
    `goal-int-${id.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()}@example.test`;

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
      profile: overrides.profile ?? {},
      settings: overrides.settings ?? {},
      emailAddress,
      emailIsVerified: true,
      emailVerifiedAt: new Date(),
      emailIsPrimary: true,
      deletedAt: null,
    },
    create: {
      id,
      status: overrides.status ?? 'ACTIVE',
      profile: overrides.profile ?? {},
      settings: overrides.settings ?? {},
      emailAddress,
      emailIsVerified: true,
      emailVerifiedAt: new Date(),
      emailIsPrimary: true,
    },
  });
}
