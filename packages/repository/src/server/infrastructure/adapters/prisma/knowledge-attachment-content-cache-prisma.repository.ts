import type { PrismaClient } from '@dailyuse/database';
import type {
  IKnowledgeAttachmentContentCache,
  KnowledgeAttachmentContentCacheEntry,
} from '../../../application/ports/knowledge-attachment-content-cache.port';

type CacheRow = Awaited<ReturnType<PrismaClient['knowledgeAttachmentContentCache']['findUnique']>>;

export class KnowledgeAttachmentContentCachePrismaRepository implements IKnowledgeAttachmentContentCache {
  constructor(private readonly db: PrismaClient) {}

  async find(
    connectionId: string,
    blobSha: string,
    now: number,
  ): Promise<KnowledgeAttachmentContentCacheEntry | null> {
    const row = await this.db.knowledgeAttachmentContentCache.findUnique({
      where: { connectionId_blobSha: { connectionId, blobSha } },
    });
    if (!row) return null;
    if (row.expiresAt.getTime() <= now) {
      await this.remove(connectionId, blobSha);
      return null;
    }
    return this.toEntry(row);
  }

  async save(entry: KnowledgeAttachmentContentCacheEntry): Promise<void> {
    await this.db.knowledgeAttachmentContentCache.upsert({
      where: {
        connectionId_blobSha: {
          connectionId: entry.connectionId,
          blobSha: entry.blobSha,
        },
      },
      create: {
        connectionId: entry.connectionId,
        blobSha: entry.blobSha,
        byteSize: entry.byteSize,
        contentBytes: Buffer.from(entry.bytes),
        cachedAt: new Date(entry.cachedAt),
        expiresAt: new Date(entry.expiresAt),
      },
      update: {
        byteSize: entry.byteSize,
        contentBytes: Buffer.from(entry.bytes),
        cachedAt: new Date(entry.cachedAt),
        expiresAt: new Date(entry.expiresAt),
      },
    });
    await this.db.knowledgeAttachmentContentCache.deleteMany({
      where: { expiresAt: { lte: new Date(entry.cachedAt) } },
    });
  }

  async remove(connectionId: string, blobSha: string): Promise<void> {
    await this.db.knowledgeAttachmentContentCache.deleteMany({
      where: { connectionId, blobSha },
    });
  }

  private toEntry(row: NonNullable<CacheRow>): KnowledgeAttachmentContentCacheEntry {
    return {
      connectionId: row.connectionId,
      blobSha: row.blobSha,
      byteSize: row.byteSize,
      bytes: Uint8Array.from(row.contentBytes),
      cachedAt: row.cachedAt.getTime(),
      expiresAt: row.expiresAt.getTime(),
    };
  }
}
