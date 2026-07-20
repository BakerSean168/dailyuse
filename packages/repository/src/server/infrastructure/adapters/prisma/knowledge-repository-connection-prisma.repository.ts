import type { PrismaClient } from '@dailyuse/database';
import type {
  KnowledgeRepositoryConnectionServerDTO,
  KnowledgeRepositoryConnectionStatus,
} from '@dailyuse/contracts/repository';
import type { IKnowledgeRepositoryConnectionRepository } from '../../../application/ports/knowledge-repository-connection.repository';

type ConnectionRow = Awaited<
  ReturnType<PrismaClient['knowledgeRepositoryConnection']['findUnique']>
>;

export class KnowledgeRepositoryConnectionPrismaRepository implements IKnowledgeRepositoryConnectionRepository {
  constructor(private readonly db: PrismaClient) {}

  async findById(id: string): Promise<KnowledgeRepositoryConnectionServerDTO | null> {
    return this.toDTO(await this.db.knowledgeRepositoryConnection.findUnique({ where: { id } }));
  }

  async findByIdentityId(identityId: string): Promise<KnowledgeRepositoryConnectionServerDTO[]> {
    const rows = await this.db.knowledgeRepositoryConnection.findMany({
      where: { identityId },
      orderBy: { updatedAt: 'desc' },
    });
    return rows.map((row) => this.toDTO(row)!);
  }

  async findByGithubRepositoryId(
    githubRepositoryId: string,
  ): Promise<KnowledgeRepositoryConnectionServerDTO | null> {
    return this.toDTO(
      await this.db.knowledgeRepositoryConnection.findUnique({
        where: { githubRepositoryId },
      }),
    );
  }

  async findByInstallationAndGithubRepositoryId(
    installationId: string,
    githubRepositoryId: string,
  ): Promise<KnowledgeRepositoryConnectionServerDTO | null> {
    return this.toDTO(
      await this.db.knowledgeRepositoryConnection.findFirst({
        where: { installationId, githubRepositoryId, deletedAt: null },
      }),
    );
  }

  async listProjectionCandidates(
    limit: number,
    cursor?: { updatedAt: number; id: string },
  ): Promise<KnowledgeRepositoryConnectionServerDTO[]> {
    const rows = await this.db.knowledgeRepositoryConnection.findMany({
      where: {
        deletedAt: null,
        AND: [
          {
            OR: [
              { status: 'Active' },
              { status: 'Error', lastErrorCode: 'GITHUB_FORCE_PUSH_REQUIRES_RECONCILIATION' },
            ],
          },
          ...(cursor
            ? [
                {
                  OR: [
                    { updatedAt: { gt: new Date(cursor.updatedAt) } },
                    { updatedAt: new Date(cursor.updatedAt), id: { gt: cursor.id } },
                  ],
                },
              ]
            : []),
        ],
      },
      orderBy: [{ updatedAt: 'asc' }, { id: 'asc' }],
      take: limit,
    });
    return rows.map((row) => this.toDTO(row)!);
  }

  async save(connection: KnowledgeRepositoryConnectionServerDTO): Promise<void> {
    await this.db.knowledgeRepositoryConnection.upsert({
      where: { id: connection.id },
      create: {
        id: connection.id,
        identityId: connection.identityId,
        githubUserId: connection.githubUserId,
        githubRepositoryId: connection.githubRepositoryId,
        githubRepositoryFullName: connection.githubRepositoryFullName,
        installationId: connection.installationId,
        defaultBranch: connection.defaultBranch,
        isPrivate: true,
        status: connection.status,
        lastSyncedCommitSha: connection.lastSyncedCommitSha,
        lastProjectedCommitSha: connection.lastProjectedCommitSha,
        lastErrorCode: connection.lastErrorCode,
        lastErrorMessage: connection.lastErrorMessage,
        version: connection.version,
        createdAt: new Date(connection.createdAt),
        updatedAt: new Date(connection.updatedAt),
        deletedAt: connection.deletedAt ? new Date(connection.deletedAt) : null,
      },
      update: {
        identityId: connection.identityId,
        githubUserId: connection.githubUserId,
        githubRepositoryFullName: connection.githubRepositoryFullName,
        installationId: connection.installationId,
        defaultBranch: connection.defaultBranch,
        isPrivate: true,
        status: connection.status,
        lastSyncedCommitSha: connection.lastSyncedCommitSha,
        lastProjectedCommitSha: connection.lastProjectedCommitSha,
        lastErrorCode: connection.lastErrorCode,
        lastErrorMessage: connection.lastErrorMessage,
        version: connection.version,
        updatedAt: new Date(connection.updatedAt),
        deletedAt: connection.deletedAt ? new Date(connection.deletedAt) : null,
      },
    });
  }

  async updateStatus(
    id: string,
    status: KnowledgeRepositoryConnectionStatus,
    error?: { code: string; message: string } | null,
  ): Promise<void> {
    await this.db.knowledgeRepositoryConnection.update({
      where: { id },
      data: {
        status,
        lastErrorCode: error?.code ?? null,
        lastErrorMessage: error?.message ?? null,
        deletedAt: status === 'Revoked' ? new Date() : null,
        version: { increment: 1 },
      },
    });
  }

  private toDTO(row: ConnectionRow): KnowledgeRepositoryConnectionServerDTO | null {
    if (!row) return null;
    return {
      id: row.id,
      identityId: row.identityId as KnowledgeRepositoryConnectionServerDTO['identityId'],
      githubUserId: row.githubUserId,
      githubRepositoryId: row.githubRepositoryId,
      githubRepositoryFullName: row.githubRepositoryFullName,
      installationId: row.installationId,
      defaultBranch: row.defaultBranch,
      status: row.status as KnowledgeRepositoryConnectionStatus,
      lastSyncedCommitSha: row.lastSyncedCommitSha,
      lastProjectedCommitSha: row.lastProjectedCommitSha,
      lastErrorCode: row.lastErrorCode,
      lastErrorMessage: row.lastErrorMessage,
      version: row.version,
      createdAt: row.createdAt.getTime() as KnowledgeRepositoryConnectionServerDTO['createdAt'],
      updatedAt: row.updatedAt.getTime() as KnowledgeRepositoryConnectionServerDTO['updatedAt'],
      deletedAt: row.deletedAt
        ? (row.deletedAt.getTime() as KnowledgeRepositoryConnectionServerDTO['deletedAt'])
        : null,
    };
  }
}
