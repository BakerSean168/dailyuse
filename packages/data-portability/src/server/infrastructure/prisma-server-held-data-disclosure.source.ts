import type { PrismaClient } from '@dailyuse/database';
import type {
  ServerHeldAiKnowledgeIndexEntry,
  ServerHeldDataDisclosureDataV1,
  ServerHeldGithubWebhookDelivery,
  ServerHeldKnowledgeAttachmentContentCache,
  ServerHeldKnowledgeAttachmentProjection,
  ServerHeldKnowledgeNoteProjection,
  ServerHeldKnowledgeRepositoryConnection,
  ServerHeldKnowledgeWriteRequest,
} from '@dailyuse/contracts/data-portability';
import type { ServerHeldDataDisclosureSource } from '../application/server-held-data-disclosure.source';

function iso(value: Date): string {
  return value.toISOString();
}

function nullableIso(value: Date | null): string | null {
  return value?.toISOString() ?? null;
}

/**
 * Prisma-backed disclosure source.
 *
 * Every query uses an explicit scalar allowlist. In particular, this source
 * never reads authentication bindings, encrypted credentials, GitHub App
 * private keys, OAuth tokens, or installation access tokens.
 */
export class PrismaServerHeldDataDisclosureSource implements ServerHeldDataDisclosureSource {
  constructor(private readonly db: PrismaClient) {}

  async readForIdentity(identityId: string): Promise<ServerHeldDataDisclosureDataV1> {
    const [connections, aiKnowledgeIndexEntries] = await Promise.all([
      this.db.knowledgeRepositoryConnection.findMany({
        where: { identityId },
        orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
        select: {
          id: true,
          githubUserId: true,
          githubRepositoryId: true,
          githubRepositoryFullName: true,
          installationId: true,
          defaultBranch: true,
          isPrivate: true,
          status: true,
          lastSyncedCommitSha: true,
          lastProjectedCommitSha: true,
          lastErrorCode: true,
          lastErrorMessage: true,
          version: true,
          createdAt: true,
          updatedAt: true,
          deletedAt: true,
          webhookDeliveries: {
            orderBy: [{ receivedAt: 'asc' }, { id: 'asc' }],
            select: {
              id: true,
              connectionId: true,
              deliveryId: true,
              eventName: true,
              beforeSha: true,
              afterSha: true,
              forced: true,
              status: true,
              errorMessage: true,
              receivedAt: true,
              processedAt: true,
            },
          },
          noteProjections: {
            orderBy: [{ relativePath: 'asc' }, { id: 'asc' }],
            select: {
              id: true,
              connectionId: true,
              relativePath: true,
              commitSha: true,
              blobSha: true,
              contentHash: true,
              frontmatter: true,
              markdownContent: true,
              indexStatus: true,
              createdAt: true,
              updatedAt: true,
              deletedAt: true,
            },
          },
          attachmentProjections: {
            orderBy: [{ relativePath: 'asc' }, { id: 'asc' }],
            select: {
              id: true,
              connectionId: true,
              relativePath: true,
              commitSha: true,
              blobSha: true,
              byteSize: true,
              mediaType: true,
              createdAt: true,
              updatedAt: true,
              deletedAt: true,
            },
          },
          attachmentContentCaches: {
            orderBy: [{ cachedAt: 'asc' }, { blobSha: 'asc' }],
            select: {
              connectionId: true,
              blobSha: true,
              byteSize: true,
              contentBytes: true,
              cachedAt: true,
              expiresAt: true,
            },
          },
          writeRequests: {
            orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
            select: {
              id: true,
              connectionId: true,
              requestId: true,
              requestHash: true,
              relativePath: true,
              status: true,
              commitSha: true,
              errorCode: true,
              errorMessage: true,
              createdAt: true,
              updatedAt: true,
              completedAt: true,
            },
          },
        },
      }),
      this.db.aiKnowledgeIndexEntry.findMany({
        where: { identityId },
        orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
        select: {
          id: true,
          repositoryId: true,
          resourceId: true,
          resourcePath: true,
          title: true,
          mimeType: true,
          contentHash: true,
          status: true,
          summary: true,
          keywords: true,
          embedding: true,
          chunks: true,
          metadata: true,
          error: true,
          indexedAt: true,
          lastRequestedAt: true,
          createdAt: true,
          updatedAt: true,
          deletedAt: true,
        },
      }),
    ]);

    return {
      knowledgeRepositoryConnections: connections.map(
        (connection): ServerHeldKnowledgeRepositoryConnection => ({
          id: connection.id,
          githubUserId: connection.githubUserId,
          githubRepositoryId: connection.githubRepositoryId,
          githubRepositoryFullName: connection.githubRepositoryFullName,
          githubInstallationId: connection.installationId,
          defaultBranch: connection.defaultBranch,
          isPrivate: connection.isPrivate,
          status: connection.status,
          lastSyncedCommitSha: connection.lastSyncedCommitSha,
          lastProjectedCommitSha: connection.lastProjectedCommitSha,
          lastErrorCode: connection.lastErrorCode,
          lastErrorMessage: connection.lastErrorMessage,
          version: connection.version,
          createdAt: iso(connection.createdAt),
          updatedAt: iso(connection.updatedAt),
          deletedAt: nullableIso(connection.deletedAt),
        }),
      ),
      githubWebhookDeliveries: connections.flatMap((connection) =>
        connection.webhookDeliveries.map((delivery): ServerHeldGithubWebhookDelivery => ({
          ...delivery,
          receivedAt: iso(delivery.receivedAt),
          processedAt: nullableIso(delivery.processedAt),
        })),
      ),
      knowledgeNoteProjections: connections.flatMap((connection) =>
        connection.noteProjections.map((projection): ServerHeldKnowledgeNoteProjection => ({
          ...projection,
          createdAt: iso(projection.createdAt),
          updatedAt: iso(projection.updatedAt),
          deletedAt: nullableIso(projection.deletedAt),
        })),
      ),
      knowledgeAttachmentProjections: connections.flatMap((connection) =>
        connection.attachmentProjections.map(
          (projection): ServerHeldKnowledgeAttachmentProjection => ({
            ...projection,
            createdAt: iso(projection.createdAt),
            updatedAt: iso(projection.updatedAt),
            deletedAt: nullableIso(projection.deletedAt),
          }),
        ),
      ),
      knowledgeAttachmentContentCaches: connections.flatMap((connection) =>
        connection.attachmentContentCaches.map(
          (entry): ServerHeldKnowledgeAttachmentContentCache => ({
            connectionId: entry.connectionId,
            blobSha: entry.blobSha,
            byteSize: entry.byteSize,
            contentBase64: Buffer.from(entry.contentBytes).toString('base64'),
            cachedAt: iso(entry.cachedAt),
            expiresAt: iso(entry.expiresAt),
          }),
        ),
      ),
      knowledgeWriteRequests: connections.flatMap((connection) =>
        connection.writeRequests.map((request): ServerHeldKnowledgeWriteRequest => ({
          ...request,
          createdAt: iso(request.createdAt),
          updatedAt: iso(request.updatedAt),
          completedAt: nullableIso(request.completedAt),
        })),
      ),
      aiKnowledgeIndexEntries: aiKnowledgeIndexEntries.map(
        (entry): ServerHeldAiKnowledgeIndexEntry => ({
          ...entry,
          indexedAt: iso(entry.indexedAt),
          lastRequestedAt: nullableIso(entry.lastRequestedAt),
          createdAt: iso(entry.createdAt),
          updatedAt: iso(entry.updatedAt),
          deletedAt: nullableIso(entry.deletedAt),
        }),
      ),
    };
  }
}
