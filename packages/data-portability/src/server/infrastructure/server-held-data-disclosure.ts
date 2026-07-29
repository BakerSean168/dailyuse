import type { PrismaClient } from '@memoflow/database';
import type { ServerHeldDataDisclosureApplicationPort } from '../application/server-held-data-disclosure.application.port';
import { ExportServerHeldDataDisclosureUseCase } from '../application/use-cases/export-server-held-data-disclosure.use-case';
import { PrismaServerHeldDataDisclosureSource } from './prisma-server-held-data-disclosure.source';

export function createPrismaServerHeldDataDisclosureApplicationPort(
  db: PrismaClient,
): ServerHeldDataDisclosureApplicationPort {
  const useCase = new ExportServerHeldDataDisclosureUseCase(
    new PrismaServerHeldDataDisclosureSource(db),
  );

  return {
    exportServerHeldDataDisclosure: (identityId) => useCase.execute(identityId),
  };
}
