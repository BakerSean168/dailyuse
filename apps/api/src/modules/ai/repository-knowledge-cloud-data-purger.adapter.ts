import type { PrismaClient } from '@dailyuse/database';
import { Prisma } from '@dailyuse/database/prisma';

/**
 * Composition-edge cleanup for a disconnected GitHub knowledge repository.
 *
 * The Repository module owns the connection lifecycle, while the AI index is
 * an independent table with no foreign key to that connection. Keeping this
 * transaction at the host edge lets both modules be cleaned up atomically
 * without making either module depend on the other's internals.
 */
export class RepositoryKnowledgeCloudDataPurgerAdapter {
  constructor(private readonly db: PrismaClient) {}

  async purge(identityId: string, connectionId: string): Promise<boolean> {
    return this.db.$transaction(async (tx: Prisma.TransactionClient) => {
      const connection = await tx.knowledgeRepositoryConnection.findFirst({
        where: { id: connectionId, identityId, deletedAt: null },
        select: { id: true },
      });
      if (!connection) return false;

      await tx.aiKnowledgeIndexEntry.deleteMany({
        where: { identityId, repositoryId: connection.id },
      });
      await tx.knowledgeRepositoryConnection.deleteMany({
        where: { id: connection.id, identityId },
      });
      return true;
    });
  }
}
