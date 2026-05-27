import type { ExecutionContext } from '@dailyuse/contracts/shared';
import type {
  IAIExecutionLogPort,
  IKnowledgeIndexRepository,
  IKnowledgeIngestionPort,
  KnowledgeSourceResource,
  KnowledgeIndexedResource,
} from '../../ports';
import { createLogger } from '@dailyuse/utils/logger';
import {
  resolveSourceContentHash,
  recordExecution,
  type SyncKnowledgeResourcesOptions,
  type SyncKnowledgeResourcesResult,
} from './ai-knowledge-index-helpers';

const logger = createLogger('SyncKnowledgeResourcesUseCase');

/**
 * 同步知识资源索引
 */
export class SyncKnowledgeResourcesUseCase {
  constructor(
    private readonly knowledgeIndexRepository: IKnowledgeIndexRepository,
    private readonly knowledgeIngestionPort: IKnowledgeIngestionPort,
    private readonly executionLogPort?: IAIExecutionLogPort,
  ) {}

  async execute(
    resources: KnowledgeSourceResource[],
    cx: ExecutionContext,
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
      cx.identityId,
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
      const sourceContentHash = resolveSourceContentHash(resource);
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
          identityId: cx.identityId,
          resourceId: resource.resourceId,
          resourcePath: resource.resourcePath,
        });

        await this.knowledgeIndexRepository.markFailed({
          identityId: cx.identityId,
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
      cx.identityId,
      resources.map((resource) => resource.resourceId),
      requestedAt,
    );

    await recordExecution(this.executionLogPort, {
      identityId: cx.identityId,
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
}
