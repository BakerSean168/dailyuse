import type { PrismaClient } from '@memoflow/database';
import type {
  IKnowledgeRepositoryConnectionWriteTransactionRunner,
  KnowledgeRepositoryConnectionWriteRepositories,
} from '../../../application/ports/knowledge-repository-connection-write-transaction.runner';
import { KnowledgeRepositoryConnectionPrismaRepository } from './knowledge-repository-connection-prisma.repository';
import { KnowledgeRepositoryInstallationIntentPrismaRepository } from './knowledge-repository-installation-intent-prisma.repository';

/**
 * Prisma-owned atomic boundary for granting a knowledge repository connection.
 * Both the connection write and installation-intent consumption use the same
 * transaction client so either both become durable or neither does.
 */
export class KnowledgeRepositoryConnectionWritePrismaTransactionRunner implements IKnowledgeRepositoryConnectionWriteTransactionRunner {
  constructor(private readonly db: PrismaClient) {}

  async run<T>(
    work: (repositories: KnowledgeRepositoryConnectionWriteRepositories) => Promise<T>,
  ): Promise<T> {
    return this.db.$transaction(async (tx) =>
      work({
        connectionRepository: new KnowledgeRepositoryConnectionPrismaRepository(tx),
        installationIntentRepository: new KnowledgeRepositoryInstallationIntentPrismaRepository(tx),
      }),
    );
  }
}
