import type { KnowledgeSourceResource } from './knowledge-ingestion.port';

export interface IKnowledgeSourcePort {
  listRelevantResources(
    identityId: string,
    query: string,
    limit: number,
  ): Promise<KnowledgeSourceResource[]>;
  listIndexableResources(identityId: string, limit: number): Promise<KnowledgeSourceResource[]>;
  getResourceById(identityId: string, resourceId: string): Promise<KnowledgeSourceResource | null>;
}
