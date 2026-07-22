import type { IElectronDatabase } from '@dailyuse/contracts/electron';
import type {
  IKnowledgeIndexRepository,
  KnowledgeIndexDiagnostics,
  KnowledgeIndexFailureRecord,
  KnowledgeIndexedChunk,
  KnowledgeIndexedNote,
} from '../../../application/ports';

const KNOWLEDGE_INDEX_KEY = 'aiKnowledgeIndex';

interface PowerSyncResourceRow {
  id: string;
  identity_id: string;
  repository_id: string;
  name: string;
  type: string;
  path: string;
  metadata: string | null;
}

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

function parseJsonRecord(value: string | null): Record<string, unknown> {
  if (!value) {
    return {};
  }

  try {
    const parsed = JSON.parse(value);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {};
    }
    return { ...(parsed as Record<string, unknown>) };
  } catch {
    return {};
  }
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

function parseStoredIndex(metadata: Record<string, unknown>): StoredKnowledgeIndexRecord | null {
  const candidate = metadata[KNOWLEDGE_INDEX_KEY];
  if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) {
    return null;
  }

  const row = candidate as Record<string, unknown>;
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

function scoreIndexedResource(resource: KnowledgeIndexedNote, query: string): number {
  const trimmedQuery = query.trim().toLowerCase();
  if (trimmedQuery.length === 0) {
    return 1;
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

  return score;
}

export class AIKnowledgeIndexPowerSyncRepository implements IKnowledgeIndexRepository {
  constructor(private readonly db: IElectronDatabase) {}

  async getDiagnostics(): Promise<KnowledgeIndexDiagnostics> {
    return {
      persistenceBackend: 'powersync-resource-metadata',
      persistenceStatus: 'enabled',
      vectorRecallBackend: 'local-js-hybrid',
      vectorRecallStatus: 'fallback',
      vectorRecallReason:
        'Desktop and PowerSync currently use metadata-backed lexical or hybrid retrieval without pgvector ANN support.',
    };
  }

  async findRelevantNotes(
    identityId: string,
    query: string,
    limit: number,
  ): Promise<KnowledgeIndexedNote[]> {
    if (limit <= 0) {
      return [];
    }

    const rows = await this.db.getAll<PowerSyncResourceRow>(
      `SELECT id, identity_id, repository_id, name, type, path, metadata
       FROM resources
       WHERE identity_id = ? AND deleted_at IS NULL`,
      [identityId],
    );

    const indexedNotes = rows
      .map((row): KnowledgeIndexedNote | null => {
        const metadata = parseJsonRecord(row.metadata);
        const stored = parseStoredIndex(metadata);
        if (!stored || stored.status !== 'indexed') {
          return null;
        }

        return {
          identityId: row.identity_id,
          repositoryId: row.repository_id,
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
        } satisfies KnowledgeIndexedNote;
      })
      .filter((item): item is KnowledgeIndexedNote => item !== null);

    if (query.trim().length === 0) {
      return indexedNotes.slice(0, limit);
    }

    return indexedNotes
      .map((resource) => ({
        resource,
        score: scoreIndexedResource(resource, query),
      }))
      .filter(({ score }) => score > 0)
      .sort((left, right) => right.score - left.score)
      .slice(0, limit)
      .map(({ resource }) => resource);
  }

  async findByNoteIds(
    identityId: string,
    resourceIds: string[],
  ): Promise<KnowledgeIndexedNote[]> {
    if (resourceIds.length === 0) {
      return [];
    }

    const placeholders = resourceIds.map(() => '?').join(', ');
    const rows = await this.db.getAll<PowerSyncResourceRow>(
      `SELECT id, identity_id, repository_id, name, type, path, metadata
       FROM resources
       WHERE identity_id = ? AND id IN (${placeholders}) AND deleted_at IS NULL`,
      [identityId, ...resourceIds],
    );

    const indexedNotes = rows
      .map((row): KnowledgeIndexedNote | null => {
        const metadata = parseJsonRecord(row.metadata);
        const stored = parseStoredIndex(metadata);
        if (!stored || stored.status !== 'indexed') {
          return null;
        }

        return {
          identityId: row.identity_id,
          repositoryId: row.repository_id,
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
        } satisfies KnowledgeIndexedNote;
      })
      .filter((item): item is KnowledgeIndexedNote => item !== null);

    return indexedNotes;
  }

  async upsert(resource: KnowledgeIndexedNote): Promise<void> {
    const row = await this.db.getOptional<{ metadata: string | null }>(
      `SELECT metadata FROM resources WHERE id = ? AND identity_id = ? AND deleted_at IS NULL LIMIT 1`,
      [resource.resourceId, resource.identityId],
    );

    if (!row) {
      return;
    }

    const metadata = parseJsonRecord(row.metadata);
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

    await this.db.execute(`UPDATE resources SET metadata = ? WHERE id = ?`, [
      JSON.stringify(metadata),
      resource.resourceId,
    ]);
  }

  async markRequested(
    identityId: string,
    resourceIds: string[],
    requestedAt: number,
  ): Promise<void> {
    if (resourceIds.length === 0) {
      return;
    }

    const placeholders = resourceIds.map(() => '?').join(', ');
    const rows = await this.db.getAll<{ id: string; metadata: string | null }>(
      `SELECT id, metadata
       FROM resources
       WHERE identity_id = ? AND id IN (${placeholders}) AND deleted_at IS NULL`,
      [identityId, ...resourceIds],
    );

    await Promise.all(
      rows.map(async (row) => {
        const metadata = parseJsonRecord(row.metadata);
        const stored = parseStoredIndex(metadata);
        if (!stored) {
          return;
        }

        metadata[KNOWLEDGE_INDEX_KEY] = {
          ...stored,
          lastRequestedAt: requestedAt,
        } satisfies StoredKnowledgeIndexRecord;

        await this.db.execute(`UPDATE resources SET metadata = ? WHERE id = ?`, [
          JSON.stringify(metadata),
          row.id,
        ]);
      }),
    );
  }

  async markFailed(record: KnowledgeIndexFailureRecord): Promise<void> {
    const row = await this.db.getOptional<{ metadata: string | null }>(
      `SELECT metadata FROM resources WHERE id = ? AND identity_id = ? AND deleted_at IS NULL LIMIT 1`,
      [record.resourceId, record.identityId],
    );

    if (!row) {
      return;
    }

    const metadata = parseJsonRecord(row.metadata);
    metadata[KNOWLEDGE_INDEX_KEY] = {
      status: 'failed',
      contentHash: record.contentHash,
      indexedAt: Date.now(),
      lastRequestedAt: Date.now(),
      error: record.error,
    } satisfies StoredKnowledgeIndexRecord;

    await this.db.execute(`UPDATE resources SET metadata = ? WHERE id = ?`, [
      JSON.stringify(metadata),
      record.resourceId,
    ]);
  }

  async removeByNoteId(identityId: string, resourceId: string): Promise<void> {
    const row = await this.db.getOptional<{ metadata: string | null }>(
      `SELECT metadata FROM resources WHERE id = ? AND identity_id = ? LIMIT 1`,
      [resourceId, identityId],
    );
    if (!row) return;

    const metadata = parseJsonRecord(row.metadata);
    if (!(KNOWLEDGE_INDEX_KEY in metadata)) return;
    delete metadata[KNOWLEDGE_INDEX_KEY];
    await this.db.execute(`UPDATE resources SET metadata = ? WHERE id = ?`, [
      JSON.stringify(metadata),
      resourceId,
    ]);
  }
}
