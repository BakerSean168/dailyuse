import { createHash } from 'node:crypto';

import type {
  IAIExecutionLogPort,
  IKnowledgeIndexRepository,
  IKnowledgeIngestionPort,
  IKnowledgeSourcePort,
  ChatExecutionProviderConfig,
  KnowledgeIndexedResource,
  KnowledgeSourceResource,
} from '../../ports';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('AIKnowledgeIndexService');

export interface SyncKnowledgeResourcesOptions {
  force?: boolean;
  requestId?: string;
  providerConfig?: ChatExecutionProviderConfig;
}

export interface SyncKnowledgeResourcesResult {
  indexedResources: KnowledgeIndexedResource[];
  indexedCount: number;
  reusedCount: number;
  failedCount: number;
  results: Array<{
    resourceId: string;
    resourcePath: string;
    status: 'indexed' | 'reused' | 'failed';
    error?: string;
  }>;
}

function mergeUniqueResources(resources: KnowledgeSourceResource[]): KnowledgeSourceResource[] {
  const seen = new Set<string>();
  const merged: KnowledgeSourceResource[] = [];

  for (const resource of resources) {
    if (seen.has(resource.resourceId)) {
      continue;
    }
    seen.add(resource.resourceId);
    merged.push(resource);
  }

  return merged;
}

export interface SyncKnowledgeResourceByIdResult {
  resource: KnowledgeSourceResource | null;
  sync: SyncKnowledgeResourcesResult | null;
}

export class AIKnowledgeIndexService {
  constructor(
    private readonly knowledgeSourcePort: IKnowledgeSourcePort,
    private readonly knowledgeIndexRepository: IKnowledgeIndexRepository,
    private readonly knowledgeIngestionPort: IKnowledgeIngestionPort,
    private readonly executionLogPort?: IAIExecutionLogPort,
  ) {}

  async reindexAllKnowledge(
    identityId: string,
    limit = 200,
    options?: SyncKnowledgeResourcesOptions,
  ): Promise<SyncKnowledgeResourcesResult> {
    const resources = await this.knowledgeSourcePort.listIndexableResources(identityId, limit);
    return this.syncResources(identityId, resources, {
      ...options,
      force: options?.force ?? true,
    });
  }

  async syncRelevantKnowledge(
    identityId: string,
    query: string,
    limit: number,
    options?: SyncKnowledgeResourcesOptions,
  ): Promise<{
    resources: KnowledgeSourceResource[];
    sync: SyncKnowledgeResourcesResult;
  }> {
    const requestedLimit = Math.max(limit, 1);
    const candidateLimit = Math.min(Math.max(requestedLimit * 4, 24), 80);
    const indexedCandidates = await this.knowledgeIndexRepository.findRelevantResources(
      identityId,
      query,
      candidateLimit,
    );
    const hydratedIndexedCandidates = mergeUniqueResources(
      (
        await Promise.all(
          indexedCandidates.map(async (resource) =>
            this.knowledgeSourcePort.getResourceById(identityId, resource.resourceId),
          ),
        )
      ).filter((resource): resource is KnowledgeSourceResource => resource !== null),
    );
    const relevantResources =
      hydratedIndexedCandidates.length >= Math.min(requestedLimit, 6)
        ? []
        : await this.knowledgeSourcePort.listRelevantResources(identityId, query, candidateLimit);
    const fallbackResources =
      hydratedIndexedCandidates.length + relevantResources.length >= Math.min(requestedLimit, 6)
        ? []
        : await this.knowledgeSourcePort.listIndexableResources(identityId, candidateLimit);
    const resources = mergeUniqueResources([
      ...hydratedIndexedCandidates,
      ...relevantResources,
      ...fallbackResources,
    ]).slice(0, candidateLimit);
    const sync = await this.syncResources(identityId, resources, options);
    return {
      resources,
      sync,
    };
  }

  async syncResourceById(
    identityId: string,
    resourceId: string,
    options?: SyncKnowledgeResourcesOptions,
  ): Promise<SyncKnowledgeResourceByIdResult> {
    const resource = await this.knowledgeSourcePort.getResourceById(identityId, resourceId);
    if (!resource) {
      return {
        resource: null,
        sync: null,
      };
    }

    return {
      resource,
      sync: await this.syncResources(identityId, [resource], {
        ...options,
        force: options?.force ?? true,
      }),
    };
  }

  async syncResources(
    identityId: string,
    resources: KnowledgeSourceResource[],
    options?: SyncKnowledgeResourcesOptions,
  ): Promise<SyncKnowledgeResourcesResult> {
    if (resources.length === 0) {
      return {
        indexedResources: [],
        indexedCount: 0,
        reusedCount: 0,
        failedCount: 0,
        results: [],
      };
    }

    const requestedAt = Date.now();
    const cachedResources = await this.knowledgeIndexRepository.findByResourceIds(
      identityId,
      resources.map((resource) => resource.resourceId),
    );
    const cachedByResourceId = new Map(
      cachedResources.map((resource) => [resource.resourceId, resource] as const),
    );

    const indexedResources: KnowledgeIndexedResource[] = [];
    const results: SyncKnowledgeResourcesResult['results'] = [];
    let indexedCount = 0;
    let reusedCount = 0;
    let failedCount = 0;

    for (const resource of resources) {
      const cached = cachedByResourceId.get(resource.resourceId);
      const sourceContentHash = this.resolveSourceContentHash(resource);
      const canReuse =
        !options?.force && cached && cached.contentHash === sourceContentHash;

      if (canReuse && cached) {
        indexedResources.push(cached);
        results.push({
          resourceId: resource.resourceId,
          resourcePath: resource.resourcePath,
          status: 'reused',
        });
        reusedCount += 1;
        continue;
      }

      try {
        const indexed = await this.knowledgeIngestionPort.indexResource({
          resource,
          providerConfig: options?.providerConfig,
        });
        await this.knowledgeIndexRepository.upsert(indexed);
        indexedResources.push(indexed);
        results.push({
          resourceId: resource.resourceId,
          resourcePath: resource.resourcePath,
          status: 'indexed',
        });
        indexedCount += 1;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to index resource';
        failedCount += 1;
        results.push({
          resourceId: resource.resourceId,
          resourcePath: resource.resourcePath,
          status: 'failed',
          error: message,
        });
        logger.error('Knowledge indexing failed', {
          error,
          identityId,
          resourceId: resource.resourceId,
          resourcePath: resource.resourcePath,
        });

        await this.knowledgeIndexRepository.markFailed({
          identityId,
          repositoryId: resource.repositoryId,
          resourceId: resource.resourceId,
          resourcePath: resource.resourcePath,
          title: resource.title,
          mimeType: resource.mimeType,
          contentHash: sourceContentHash,
          metadata: resource.metadata ?? {},
          error: message,
        });

        if (cached) {
          indexedResources.push(cached);
        }
      }
    }

    await this.knowledgeIndexRepository.markRequested(
      identityId,
      resources.map((resource) => resource.resourceId),
      requestedAt,
    );

    await this.recordExecution({
      identityId,
      taskType: 'KNOWLEDGE_INDEX_SYNC',
      status: failedCount > 0 ? 'FAILED' : 'COMPLETED',
      requestId: options?.requestId,
      errorCategory: failedCount > 0 ? 'partial_failure' : undefined,
      input: {
        resourceIds: resources.map((resource) => resource.resourceId),
        force: options?.force ?? false,
      },
      result: {
        indexedCount,
        reusedCount,
        failedCount,
      },
      error:
        failedCount > 0
          ? `${failedCount} resource(s) failed during knowledge indexing`
          : undefined,
      processingMs: Date.now() - requestedAt,
    });

    return {
      indexedResources,
      indexedCount,
      reusedCount,
      failedCount,
      results,
    };
  }

  private resolveSourceContentHash(resource: KnowledgeSourceResource): string {
    const metadataHash = resource.metadata?.['contentDigest'];
    if (typeof metadataHash === 'string' && metadataHash.length > 0) {
      return metadataHash;
    }

    return createHash('sha256').update(resource.content).digest('hex');
  }

  private async recordExecution(input: Parameters<NonNullable<IAIExecutionLogPort['record']>>[0]) {
    if (!this.executionLogPort) {
      return;
    }

    try {
      await this.executionLogPort.record(input);
    } catch (error) {
      logger.warn('Failed to record knowledge indexing execution log', { error, taskType: input.taskType });
    }
  }
}
