import type { PrismaClient } from '@memoflow/database';
import type {
  IKnowledgeWriteRequestRepository,
  KnowledgeWriteRequestRecord,
  KnowledgeWriteRequestStatus,
} from '../../../application/ports/knowledge-note-projection.repository';

type WriteRow = Awaited<ReturnType<PrismaClient['knowledgeWriteRequest']['findUnique']>>;

export class KnowledgeWriteRequestPrismaRepository implements IKnowledgeWriteRequestRepository {
  constructor(private readonly db: PrismaClient) {}

  async findByIdentityAndRequestId(identityId: string, requestId: string) {
    return this.toRecord(
      await this.db.knowledgeWriteRequest.findUnique({
        where: { identityId_requestId: { identityId, requestId } },
      }),
    );
  }

  async create(record: KnowledgeWriteRequestRecord): Promise<boolean> {
    try {
      await this.db.knowledgeWriteRequest.create({
        data: {
          id: record.id,
          identityId: record.identityId,
          connectionId: record.connectionId,
          requestId: record.requestId,
          requestHash: record.requestHash,
          relativePath: record.relativePath,
          status: record.status,
          commitSha: record.commitSha,
          errorCode: record.errorCode,
          errorMessage: record.errorMessage,
          createdAt: new Date(record.createdAt),
          updatedAt: new Date(record.updatedAt),
          completedAt: record.completedAt ? new Date(record.completedAt) : null,
        },
      });
      return true;
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
        return false;
      }
      throw error;
    }
  }

  async markCommitted(identityId: string, id: string, commitSha: string): Promise<void> {
    const updated = await this.db.knowledgeWriteRequest.updateMany({
      where: { id, identityId },
      data: {
        status: 'Committed',
        commitSha,
        errorCode: null,
        errorMessage: null,
        completedAt: new Date(),
      },
    });
    if (updated.count !== 1) {
      throw new Error('Knowledge write request not found for the current identity.');
    }
  }

  async retryFailed(identityId: string, id: string, updatedAt: number): Promise<boolean> {
    const updated = await this.db.knowledgeWriteRequest.updateMany({
      where: { id, identityId, status: 'Failed' },
      data: {
        status: 'Pending',
        commitSha: null,
        errorCode: null,
        errorMessage: null,
        updatedAt: new Date(updatedAt),
        completedAt: null,
      },
    });
    return updated.count === 1;
  }

  async markFailed(identityId: string, id: string, code: string, message: string): Promise<void> {
    const updated = await this.db.knowledgeWriteRequest.updateMany({
      where: { id, identityId },
      data: { status: 'Failed', errorCode: code, errorMessage: message },
    });
    if (updated.count !== 1) {
      throw new Error('Knowledge write request not found for the current identity.');
    }
  }

  private toRecord(row: WriteRow): KnowledgeWriteRequestRecord | null {
    if (!row) return null;
    return {
      id: row.id,
      identityId: row.identityId,
      connectionId: row.connectionId,
      requestId: row.requestId,
      requestHash: row.requestHash,
      relativePath: row.relativePath,
      status: row.status as KnowledgeWriteRequestStatus,
      commitSha: row.commitSha,
      errorCode: row.errorCode,
      errorMessage: row.errorMessage,
      createdAt: row.createdAt.getTime(),
      updatedAt: row.updatedAt.getTime(),
      completedAt: row.completedAt?.getTime() ?? null,
    };
  }
}
