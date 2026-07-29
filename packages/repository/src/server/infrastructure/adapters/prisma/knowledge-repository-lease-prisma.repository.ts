import type { PrismaClient } from '@memoflow/database';
import type {
  IKnowledgeRepositoryLeaseRepository,
  KnowledgeRepositoryLeaseRequest,
} from '../../../application/ports/knowledge-repository-lease.repository';

export class KnowledgeRepositoryLeasePrismaRepository implements IKnowledgeRepositoryLeaseRepository {
  constructor(private readonly db: PrismaClient) {}

  async tryAcquire(request: KnowledgeRepositoryLeaseRequest): Promise<boolean> {
    const updated = await this.db.knowledgeRepositoryLease.updateMany({
      where: {
        leaseKey: request.leaseKey,
        expiresAt: { lte: new Date(request.now) },
      },
      data: {
        ownerToken: request.ownerToken,
        expiresAt: new Date(request.expiresAt),
        updatedAt: new Date(request.now),
      },
    });
    if (updated.count === 1) return true;
    try {
      await this.db.knowledgeRepositoryLease.create({
        data: {
          id: `knowledge-lease-${request.ownerToken}`,
          leaseKey: request.leaseKey,
          ownerToken: request.ownerToken,
          expiresAt: new Date(request.expiresAt),
          createdAt: new Date(request.now),
          updatedAt: new Date(request.now),
        },
      });
      return true;
    } catch (error) {
      if (this.isUniqueConstraint(error)) return false;
      throw error;
    }
  }

  async renew(request: KnowledgeRepositoryLeaseRequest): Promise<boolean> {
    const updated = await this.db.knowledgeRepositoryLease.updateMany({
      where: {
        leaseKey: request.leaseKey,
        ownerToken: request.ownerToken,
        expiresAt: { gt: new Date(request.now) },
      },
      data: {
        expiresAt: new Date(request.expiresAt),
        updatedAt: new Date(request.now),
      },
    });
    return updated.count === 1;
  }

  async release(leaseKey: string, ownerToken: string): Promise<void> {
    await this.db.knowledgeRepositoryLease.deleteMany({ where: { leaseKey, ownerToken } });
  }

  private isUniqueConstraint(error: unknown): boolean {
    return Boolean(error && typeof error === 'object' && 'code' in error && error.code === 'P2002');
  }
}
