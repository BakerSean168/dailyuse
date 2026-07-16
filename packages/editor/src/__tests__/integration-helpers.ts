import type { PrismaClient } from '@dailyuse/database';
import { cleanAllTables } from '@dailyuse/test-utils/setup/database';
import { IdentityId } from '@dailyuse/domain-shared';

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

export async function seedAccount(identityId = IdentityId.generate()): Promise<string> {
  const prisma = await getPrisma();
  const emailAddress =
    `editor-int-${identityId.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()}@example.test`;

  await prisma.authIdentity.create({
    data: {
      id: identityId,
      status: 'Unverified',
    },
  });
  await prisma.account.create({
    data: {
      id: identityId,
      status: 'ACTIVE',
      profile: {},
      settings: {},
      emailAddress,
      emailIsVerified: true,
      emailVerifiedAt: new Date(),
      emailIsPrimary: true,
    },
  });

  return identityId;
}
