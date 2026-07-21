import type { KnowledgeIndexedResource } from './knowledge-ingestion.port';

export interface KnowledgeIndexDiagnostics {
  persistenceBackend:
    'powersync-resource-metadata' | 'prisma-index-table';
  persistenceStatus: 'enabled' | 'fallback';
  persistenceReason?: string;
  vectorRecallBackend: 'none' | 'local-js-hybrid' | 'pgvector-ivfflat';
  vectorRecallStatus: 'enabled' | 'fallback' | 'unknown';
  vectorRecallReason?: string;
}

export interface KnowledgeIndexFailureRecord {
  identityId: string;
  repositoryId: string;
  resourceId: string;
  resourcePath: string;
  title?: string;
  mimeType: string;
  contentHash: string;
  metadata: Record<string, unknown>;
  error: string;
}

export interface IKnowledgeIndexRepository {
  getDiagnostics(): Promise<KnowledgeIndexDiagnostics>;
  findByResourceIds(identityId: string, resourceIds: string[]): Promise<KnowledgeIndexedResource[]>;
  findRelevantResources(
    identityId: string,
    query: string,
    limit: number,
  ): Promise<KnowledgeIndexedResource[]>;
  upsert(resource: KnowledgeIndexedResource): Promise<void>;
  markRequested(identityId: string, resourceIds: string[], requestedAt: number): Promise<void>;
  markFailed(record: KnowledgeIndexFailureRecord): Promise<void>;
  removeByResourceId(identityId: string, resourceId: string): Promise<void>;
}
