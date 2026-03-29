import { createHash, randomUUID } from 'node:crypto';

import { Prisma, type PrismaClient } from '@dailyuse/database/prisma';
import type {
  IKnowledgeIndexRepository,
  KnowledgeIndexDiagnostics,
  KnowledgeIndexFailureRecord,
  KnowledgeIndexedChunk,
  KnowledgeIndexedResource,
} from '../../../application-server/ports';

const KNOWLEDGE_INDEX_KEY = 'aiKnowledgeIndex';
const RETRIEVAL_VECTOR_DIMENSION = 48;

interface StoredKnowledgeIndexRecord {
  status: 'indexed' | 'failed';
  contentHash: string;
  summary?: string;
  keywords?: string[];
  embedding?: number[];
  chunks?: KnowledgeIndexedChunk[];
  indexedAt: number;
  lastRequestedAt?: number;
  error?: string;
}

type KnowledgeIndexEntryRow = {
  id: string;
  identityId: string;
  repositoryId: string;
  resourceId: string;
  resourcePath: string;
  title: string | null;
  mimeType: string;
  contentHash: string;
  status: string;
  summary: string | null;
  keywords: Prisma.JsonValue | null;
  embedding: Prisma.JsonValue | null;
  chunks: Prisma.JsonValue | null;
  metadata: Prisma.JsonValue | null;
  error: string | null;
  indexedAt: Date;
  lastRequestedAt: Date | null;
};

type KnowledgeVectorMatchRow = KnowledgeIndexEntryRow & {
  retrievalScore: number | null;
};

function toObjectRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }

  return { ...(value as Record<string, unknown>) };
}

function toStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : [];
}

function toNumberArray(value: unknown): number[] {
  return Array.isArray(value)
    ? value.filter((item): item is number => typeof item === 'number')
    : [];
}

function tokenize(text: string): string[] {
  return (text.toLowerCase().match(/[a-z0-9_]+/g) ?? []).filter((token) => token.length > 1);
}

function charNGrams(token: string, minSize = 3, maxSize = 5): string[] {
  const padded = `^${token}$`;
  const grams: string[] = [];
  for (let size = minSize; size <= Math.min(maxSize, padded.length); size += 1) {
    for (let index = 0; index <= padded.length - size; index += 1) {
      grams.push(padded.slice(index, index + size));
    }
  }
  return grams;
}

function projectFeature(feature: string): { bucket: number; sign: number } {
  const digest = createHash('sha256').update(feature).digest();
  const bucket = digest.readUInt32BE(0) % RETRIEVAL_VECTOR_DIMENSION;
  const sign = digest[4] % 2 === 0 ? 1 : -1;
  return { bucket, sign };
}

function normalizeVector(vector: number[]): number[] {
  const magnitude = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));
  if (magnitude === 0) {
    return vector;
  }
  return vector.map((value) => Number((value / magnitude).toFixed(6)));
}

function buildRetrievalEmbedding(text: string): number[] {
  const tokenCounts = new Map<string, number>();
  for (const token of tokenize(text)) {
    tokenCounts.set(token, (tokenCounts.get(token) ?? 0) + 1);
  }

  const vector = Array.from({ length: RETRIEVAL_VECTOR_DIMENSION }, () => 0);
  for (const [token, count] of tokenCounts) {
    const tokenProjection = projectFeature(`tok:${token}`);
    vector[tokenProjection.bucket] += tokenProjection.sign * (1 + Math.log1p(count));

    for (const gram of charNGrams(token)) {
      const gramProjection = projectFeature(`ng:${gram}`);
      vector[gramProjection.bucket] += gramProjection.sign * (0.2 * count);
    }
  }

  return normalizeVector(vector);
}

function toVectorLiteral(vector: number[]): string {
  return `[${vector.map((value) => Number(value.toFixed(6))).join(',')}]`;
}

function toChunkArray(value: unknown): KnowledgeIndexedChunk[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) {
        return null;
      }

      const row = item as Record<string, unknown>;
      return {
        chunkIndex: typeof row.chunkIndex === 'number' ? row.chunkIndex : 0,
        content: typeof row.content === 'string' ? row.content : '',
        contentHash: typeof row.contentHash === 'string' ? row.contentHash : '',
        startOffset: typeof row.startOffset === 'number' ? row.startOffset : 0,
        endOffset: typeof row.endOffset === 'number' ? row.endOffset : 0,
        headingPath: toStringArray(row.headingPath),
        keywords: toStringArray(row.keywords),
        embedding: toNumberArray(row.embedding),
      } satisfies KnowledgeIndexedChunk;
    })
    .filter((item): item is KnowledgeIndexedChunk => item !== null && item.content.length > 0);
}

function parseStoredIndex(value: unknown): StoredKnowledgeIndexRecord | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  const row = value as Record<string, unknown>;
  if (row.status !== 'indexed' && row.status !== 'failed') {
    return null;
  }
  if (typeof row.contentHash !== 'string' || row.contentHash.length === 0) {
    return null;
  }
  if (typeof row.indexedAt !== 'number') {
    return null;
  }

  return {
    status: row.status,
    contentHash: row.contentHash,
    summary: typeof row.summary === 'string' ? row.summary : undefined,
    keywords: toStringArray(row.keywords),
    embedding: toNumberArray(row.embedding),
    chunks: toChunkArray(row.chunks),
    indexedAt: row.indexedAt,
    lastRequestedAt: typeof row.lastRequestedAt === 'number' ? row.lastRequestedAt : undefined,
    error: typeof row.error === 'string' ? row.error : undefined,
  };
}

function resolveMimeType(metadata: Record<string, unknown>, fallbackType: string): string {
  if (typeof metadata.mimeType === 'string' && metadata.mimeType.length > 0) {
    return metadata.mimeType;
  }

  if (fallbackType === 'markdown') {
    return 'text/markdown';
  }
  if (fallbackType === 'code') {
    return 'text/plain';
  }

  return 'text/plain';
}

function toPrismaJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function mapEntryRowToIndexedResource(
  row: KnowledgeIndexEntryRow,
): KnowledgeIndexedResource | null {
  if (row.status !== 'indexed') {
    return null;
  }

  const metadata = toObjectRecord(row.metadata);
  return {
    identityId: row.identityId,
    repositoryId: row.repositoryId,
    resourceId: row.resourceId,
    resourcePath: row.resourcePath,
    title: row.title ?? undefined,
    mimeType: row.mimeType,
    contentHash: row.contentHash,
    summary: row.summary ?? '',
    keywords: toStringArray(row.keywords),
    embedding: toNumberArray(row.embedding),
    chunks: toChunkArray(row.chunks),
    metadata,
  } satisfies KnowledgeIndexedResource;
}

function scoreIndexedResource(
  resource: KnowledgeIndexedResource,
  query: string,
  semanticScore = 0,
): number {
  const trimmedQuery = query.trim().toLowerCase();
  if (trimmedQuery.length === 0) {
    return semanticScore > 0 ? semanticScore : 1;
  }

  const tokens = new Set(tokenize(trimmedQuery));
  const keywordSet = new Set(resource.keywords.map((keyword) => keyword.toLowerCase()));
  const haystack =
    `${resource.title ?? ''} ${resource.resourcePath} ${resource.summary} ${resource.keywords.join(' ')}`.toLowerCase();
  let score = 0;

  for (const token of tokens) {
    if (keywordSet.has(token)) {
      score += 3;
      continue;
    }
    if (haystack.includes(token)) {
      score += 1;
    }
  }

  if ((resource.title ?? '').toLowerCase().includes(trimmedQuery)) {
    score += 3;
  }
  if (resource.resourcePath.toLowerCase().includes(trimmedQuery)) {
    score += 2;
  }
  if (resource.summary.toLowerCase().includes(trimmedQuery)) {
    score += 2;
  }

  return score + semanticScore * 4;
}

function buildRetrievalEmbeddingSource(resource: KnowledgeIndexedResource): string {
  return [
    resource.title ?? '',
    resource.resourcePath,
    resource.summary,
    resource.keywords.join(' '),
  ]
    .filter((value) => value.length > 0)
    .join(' ');
}

export class AIKnowledgeIndexPrismaRepository implements IKnowledgeIndexRepository {
  private tableSupportState: 'unknown' | 'enabled' | 'disabled' = 'unknown';
  private vectorSupportState: 'unknown' | 'enabled' | 'disabled' = 'unknown';

  constructor(private readonly prisma: PrismaClient) {}

  async getDiagnostics(): Promise<KnowledgeIndexDiagnostics> {
    const persistenceStatus = this.tableSupportState === 'disabled' ? 'fallback' : 'enabled';
    const vectorRecallStatus =
      this.tableSupportState === 'disabled'
        ? 'fallback'
        : this.vectorSupportState === 'enabled'
          ? 'enabled'
          : this.vectorSupportState === 'disabled'
            ? 'fallback'
            : 'unknown';

    return {
      persistenceBackend: 'prisma-index-table',
      persistenceStatus,
      persistenceReason:
        persistenceStatus === 'fallback'
          ? 'AiKnowledgeIndexEntry is unavailable, so knowledge indexing is using legacy repository resource metadata.'
          : undefined,
      vectorRecallBackend:
        vectorRecallStatus === 'enabled' ? 'pgvector-ivfflat' : 'local-js-hybrid',
      vectorRecallStatus,
      vectorRecallReason:
        vectorRecallStatus === 'fallback'
          ? this.tableSupportState === 'disabled'
            ? 'The dedicated knowledge index table is unavailable, so retrieval is falling back to legacy resource metadata and lexical ranking.'
            : 'pgvector retrieval is unavailable, so indexed recall is falling back to lexical or JSON-backed hybrid ranking.'
          : vectorRecallStatus === 'unknown'
            ? 'pgvector availability has not been probed yet in this process.'
            : undefined,
    };
  }

  async findRelevantResources(
    identityId: string,
    query: string,
    limit: number,
  ): Promise<KnowledgeIndexedResource[]> {
    if (limit <= 0) {
      return [];
    }

    const trimmedQuery = query.trim();
    const scanLimit = trimmedQuery.length === 0 ? limit : Math.min(Math.max(limit * 4, 40), 200);

    if (this.tableSupportState === 'disabled') {
      return this.findRelevantLegacy(identityId, trimmedQuery, limit);
    }

    try {
      if (trimmedQuery.length > 0) {
        const vectorResults = await this.findRelevantWithVectorQuery(
          identityId,
          trimmedQuery,
          scanLimit,
        );
        if (vectorResults.length > 0) {
          return vectorResults.slice(0, limit);
        }
      }

      const rows = (await this.prisma.aiKnowledgeIndexEntry.findMany({
        where: {
          identityId,
          status: 'indexed',
          deletedAt: null,
        },
        orderBy: [{ lastRequestedAt: 'desc' }, { indexedAt: 'desc' }],
        take: scanLimit,
      })) as KnowledgeIndexEntryRow[];
      this.tableSupportState = 'enabled';

      const indexedResources = rows
        .map((row) => mapEntryRowToIndexedResource(row))
        .filter((item): item is KnowledgeIndexedResource => item !== null);

      if (trimmedQuery.length === 0) {
        return indexedResources.slice(0, limit);
      }

      return indexedResources
        .map((resource) => ({
          resource,
          score: scoreIndexedResource(resource, trimmedQuery),
        }))
        .filter(({ score }) => score > 0)
        .sort((left, right) => right.score - left.score)
        .slice(0, limit)
        .map(({ resource }) => resource);
    } catch {
      this.tableSupportState = 'disabled';
      return this.findRelevantLegacy(identityId, trimmedQuery, limit);
    }
  }

  async findByResourceIds(
    identityId: string,
    resourceIds: string[],
  ): Promise<KnowledgeIndexedResource[]> {
    if (resourceIds.length === 0) {
      return [];
    }

    if (this.tableSupportState === 'disabled') {
      return this.findLegacyByResourceIds(identityId, resourceIds);
    }

    try {
      const rows = (await this.prisma.aiKnowledgeIndexEntry.findMany({
        where: {
          identityId,
          resourceId: { in: resourceIds },
          deletedAt: null,
        },
      })) as KnowledgeIndexEntryRow[];
      this.tableSupportState = 'enabled';
      const foundIds = new Set(rows.map((row) => row.resourceId));
      const tableResults = rows
        .map((row) => mapEntryRowToIndexedResource(row))
        .filter((item): item is KnowledgeIndexedResource => item !== null);

      if (foundIds.size === resourceIds.length) {
        return tableResults;
      }

      const legacyResults = await this.findLegacyByResourceIds(
        identityId,
        resourceIds.filter((resourceId) => !foundIds.has(resourceId)),
      );
      return [...tableResults, ...legacyResults];
    } catch {
      this.tableSupportState = 'disabled';
      return this.findLegacyByResourceIds(identityId, resourceIds);
    }
  }

  async upsert(resource: KnowledgeIndexedResource): Promise<void> {
    if (this.tableSupportState === 'disabled') {
      await this.upsertLegacy(resource);
      return;
    }

    try {
      await this.prisma.aiKnowledgeIndexEntry.upsert({
        where: { resourceId: resource.resourceId },
        create: {
          id: randomUUID(),
          identityId: resource.identityId,
          repositoryId: resource.repositoryId,
          resourceId: resource.resourceId,
          resourcePath: resource.resourcePath,
          title: resource.title,
          mimeType: resource.mimeType,
          contentHash: resource.contentHash,
          status: 'indexed',
          summary: resource.summary,
          keywords: toPrismaJson(resource.keywords),
          embedding: toPrismaJson(resource.embedding),
          chunks: toPrismaJson(resource.chunks),
          metadata: toPrismaJson(resource.metadata),
          error: null,
          indexedAt: new Date(),
          lastRequestedAt: new Date(),
        },
        update: {
          repositoryId: resource.repositoryId,
          resourcePath: resource.resourcePath,
          title: resource.title,
          mimeType: resource.mimeType,
          contentHash: resource.contentHash,
          status: 'indexed',
          summary: resource.summary,
          keywords: toPrismaJson(resource.keywords),
          embedding: toPrismaJson(resource.embedding),
          chunks: toPrismaJson(resource.chunks),
          metadata: toPrismaJson(resource.metadata),
          error: null,
          indexedAt: new Date(),
          lastRequestedAt: new Date(),
          deletedAt: null,
        },
      });
      this.tableSupportState = 'enabled';
      await this.updateRetrievalVector(resource);
    } catch {
      this.tableSupportState = 'disabled';
      await this.upsertLegacy(resource);
    }
  }

  async markRequested(
    identityId: string,
    resourceIds: string[],
    requestedAt: number,
  ): Promise<void> {
    if (resourceIds.length === 0) {
      return;
    }

    if (this.tableSupportState === 'disabled') {
      await this.markRequestedLegacy(identityId, resourceIds, requestedAt);
      return;
    }

    try {
      await this.prisma.aiKnowledgeIndexEntry.updateMany({
        where: {
          identityId,
          resourceId: { in: resourceIds },
          deletedAt: null,
        },
        data: {
          lastRequestedAt: new Date(requestedAt),
        },
      });
      this.tableSupportState = 'enabled';
    } catch {
      this.tableSupportState = 'disabled';
      await this.markRequestedLegacy(identityId, resourceIds, requestedAt);
    }
  }

  async markFailed(record: KnowledgeIndexFailureRecord): Promise<void> {
    if (this.tableSupportState === 'disabled') {
      await this.markFailedLegacy(record);
      return;
    }

    try {
      await this.prisma.aiKnowledgeIndexEntry.upsert({
        where: { resourceId: record.resourceId },
        create: {
          id: randomUUID(),
          identityId: record.identityId,
          repositoryId: record.repositoryId,
          resourceId: record.resourceId,
          resourcePath: record.resourcePath,
          title: record.title,
          mimeType: record.mimeType,
          contentHash: record.contentHash,
          status: 'failed',
          summary: null,
          keywords: toPrismaJson([]),
          embedding: toPrismaJson([]),
          chunks: toPrismaJson([]),
          metadata: toPrismaJson(record.metadata),
          error: record.error,
          indexedAt: new Date(),
          lastRequestedAt: new Date(),
        },
        update: {
          repositoryId: record.repositoryId,
          resourcePath: record.resourcePath,
          title: record.title,
          mimeType: record.mimeType,
          contentHash: record.contentHash,
          status: 'failed',
          summary: null,
          keywords: toPrismaJson([]),
          embedding: toPrismaJson([]),
          chunks: toPrismaJson([]),
          metadata: toPrismaJson(record.metadata),
          error: record.error,
          indexedAt: new Date(),
          lastRequestedAt: new Date(),
          deletedAt: null,
        },
      });
      this.tableSupportState = 'enabled';
      await this.clearRetrievalVector(record.resourceId);
    } catch {
      this.tableSupportState = 'disabled';
      await this.markFailedLegacy(record);
    }
  }

  private async findRelevantWithVectorQuery(
    identityId: string,
    query: string,
    scanLimit: number,
  ): Promise<KnowledgeIndexedResource[]> {
    if (this.vectorSupportState === 'disabled') {
      return [];
    }

    try {
      const queryVector = toVectorLiteral(buildRetrievalEmbedding(query));
      const rows = await this.prisma.$queryRaw<KnowledgeVectorMatchRow[]>(Prisma.sql`
        SELECT
          id,
          identity_id AS "identityId",
          repository_id AS "repositoryId",
          resource_id AS "resourceId",
          resource_path AS "resourcePath",
          title,
          mime_type AS "mimeType",
          content_hash AS "contentHash",
          status,
          summary,
          keywords,
          embedding,
          chunks,
          metadata,
          error,
          indexed_at AS "indexedAt",
          last_requested_at AS "lastRequestedAt",
          1 - (retrieval_vector <=> ${queryVector}::vector) AS "retrievalScore"
        FROM ai_knowledge_index_entries
        WHERE identity_id = ${identityId}
          AND status = 'indexed'
          AND deleted_at IS NULL
          AND retrieval_vector IS NOT NULL
        ORDER BY retrieval_vector <=> ${queryVector}::vector ASC
        LIMIT ${scanLimit}
      `);
      this.vectorSupportState = 'enabled';

      return rows
        .map((row) => {
          const resource = mapEntryRowToIndexedResource(row);
          if (!resource) {
            return null;
          }

          return {
            resource,
            score: scoreIndexedResource(resource, query, Math.max(row.retrievalScore ?? 0, 0)),
          };
        })
        .filter(
          (
            item,
          ): item is {
            resource: KnowledgeIndexedResource;
            score: number;
          } => item !== null && item.score > 0.35,
        )
        .sort((left, right) => right.score - left.score)
        .map(({ resource }) => resource);
    } catch {
      this.vectorSupportState = 'disabled';
      return [];
    }
  }

  private async findRelevantLegacy(
    identityId: string,
    query: string,
    limit: number,
  ): Promise<KnowledgeIndexedResource[]> {
    if (limit <= 0) {
      return [];
    }

    const scanLimit = query.length === 0 ? limit : Math.min(Math.max(limit * 4, 40), 200);
    const rows = await this.prisma.resource.findMany({
      where: {
        identityId,
        deletedAt: null,
      },
      take: scanLimit,
    });

    const indexedResources = rows
      .map((row): KnowledgeIndexedResource | null => {
        const metadata = toObjectRecord(row.metadata);
        const stored = parseStoredIndex(metadata[KNOWLEDGE_INDEX_KEY]);
        if (!stored || stored.status !== 'indexed') {
          return null;
        }

        return {
          identityId: row.identityId,
          repositoryId: row.repositoryId,
          resourceId: row.id,
          resourcePath: row.path,
          title: row.name,
          mimeType: resolveMimeType(metadata, row.type),
          contentHash: stored.contentHash,
          summary: stored.summary ?? '',
          keywords: stored.keywords ?? [],
          embedding: stored.embedding ?? [],
          chunks: stored.chunks ?? [],
          metadata,
        } satisfies KnowledgeIndexedResource;
      })
      .filter((item): item is KnowledgeIndexedResource => item !== null);

    if (query.length === 0) {
      return indexedResources.slice(0, limit);
    }

    return indexedResources
      .map((resource) => ({
        resource,
        score: scoreIndexedResource(resource, query),
      }))
      .filter(({ score }) => score > 0)
      .sort((left, right) => right.score - left.score)
      .slice(0, limit)
      .map(({ resource }) => resource);
  }

  private async updateRetrievalVector(resource: KnowledgeIndexedResource): Promise<void> {
    if (this.vectorSupportState === 'disabled') {
      return;
    }

    try {
      const retrievalVector = toVectorLiteral(
        buildRetrievalEmbedding(buildRetrievalEmbeddingSource(resource)),
      );
      await this.prisma.$executeRaw(
        Prisma.sql`
          UPDATE ai_knowledge_index_entries
          SET retrieval_vector = ${retrievalVector}::vector
          WHERE resource_id = ${resource.resourceId}
        `,
      );
      this.vectorSupportState = 'enabled';
    } catch {
      this.vectorSupportState = 'disabled';
      // The vector column is optional. If pgvector is unavailable, keep the JSON-backed path.
    }
  }

  private async clearRetrievalVector(resourceId: string): Promise<void> {
    if (this.vectorSupportState === 'disabled') {
      return;
    }

    try {
      await this.prisma.$executeRaw(
        Prisma.sql`
          UPDATE ai_knowledge_index_entries
          SET retrieval_vector = NULL
          WHERE resource_id = ${resourceId}
        `,
      );
      this.vectorSupportState = 'enabled';
    } catch {
      this.vectorSupportState = 'disabled';
      // The vector column is optional. If pgvector is unavailable, keep the JSON-backed path.
    }
  }

  private async findLegacyByResourceIds(
    identityId: string,
    resourceIds: string[],
  ): Promise<KnowledgeIndexedResource[]> {
    if (resourceIds.length === 0) {
      return [];
    }

    const rows = await this.prisma.resource.findMany({
      where: {
        identityId,
        id: { in: resourceIds },
        deletedAt: null,
      },
    });

    return rows
      .map((row): KnowledgeIndexedResource | null => {
        const metadata = toObjectRecord(row.metadata);
        const stored = parseStoredIndex(metadata[KNOWLEDGE_INDEX_KEY]);
        if (!stored || stored.status !== 'indexed') {
          return null;
        }

        return {
          identityId: row.identityId,
          repositoryId: row.repositoryId,
          resourceId: row.id,
          resourcePath: row.path,
          title: row.name,
          mimeType: resolveMimeType(metadata, row.type),
          contentHash: stored.contentHash,
          summary: stored.summary ?? '',
          keywords: stored.keywords ?? [],
          embedding: stored.embedding ?? [],
          chunks: stored.chunks ?? [],
          metadata,
        } satisfies KnowledgeIndexedResource;
      })
      .filter((item): item is KnowledgeIndexedResource => item !== null);
  }

  private async upsertLegacy(resource: KnowledgeIndexedResource): Promise<void> {
    const row = await this.prisma.resource.findFirst({
      where: {
        id: resource.resourceId,
        identityId: resource.identityId,
        deletedAt: null,
      },
      select: {
        metadata: true,
      },
    });

    if (!row) {
      return;
    }

    const metadata = toObjectRecord(row.metadata);
    metadata[KNOWLEDGE_INDEX_KEY] = {
      status: 'indexed',
      contentHash: resource.contentHash,
      summary: resource.summary,
      keywords: resource.keywords,
      embedding: resource.embedding,
      chunks: resource.chunks,
      indexedAt: Date.now(),
      lastRequestedAt: Date.now(),
    } satisfies StoredKnowledgeIndexRecord;

    await this.prisma.resource.update({
      where: { id: resource.resourceId },
      data: {
        metadata: toPrismaJson(metadata),
      },
    });
  }

  private async markRequestedLegacy(
    identityId: string,
    resourceIds: string[],
    requestedAt: number,
  ): Promise<void> {
    if (resourceIds.length === 0) {
      return;
    }

    const rows = await this.prisma.resource.findMany({
      where: {
        identityId,
        id: { in: resourceIds },
        deletedAt: null,
      },
      select: {
        id: true,
        metadata: true,
      },
    });

    await Promise.all(
      rows.map(async (row) => {
        const metadata = toObjectRecord(row.metadata);
        const stored = parseStoredIndex(metadata[KNOWLEDGE_INDEX_KEY]);
        if (!stored) {
          return;
        }

        metadata[KNOWLEDGE_INDEX_KEY] = {
          ...stored,
          lastRequestedAt: requestedAt,
        } satisfies StoredKnowledgeIndexRecord;

        await this.prisma.resource.update({
          where: { id: row.id },
          data: {
            metadata: toPrismaJson(metadata),
          },
        });
      }),
    );
  }

  private async markFailedLegacy(record: KnowledgeIndexFailureRecord): Promise<void> {
    const row = await this.prisma.resource.findFirst({
      where: {
        id: record.resourceId,
        identityId: record.identityId,
        deletedAt: null,
      },
      select: {
        metadata: true,
      },
    });

    if (!row) {
      return;
    }

    const metadata = toObjectRecord(row.metadata);
    metadata[KNOWLEDGE_INDEX_KEY] = {
      status: 'failed',
      contentHash: record.contentHash,
      indexedAt: Date.now(),
      lastRequestedAt: Date.now(),
      error: record.error,
    } satisfies StoredKnowledgeIndexRecord;

    await this.prisma.resource.update({
      where: { id: record.resourceId },
      data: {
        metadata: toPrismaJson(metadata),
      },
    });
  }
}
