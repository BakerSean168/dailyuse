import type {
  QueryKnowledgeReq,
  QueryKnowledgeRes,
  ReindexKnowledgeReq,
  ReindexKnowledgeRes,
} from '@dailyuse/contracts/ai';
import { createLogger } from '@dailyuse/utils';

import type { IAIProviderConfigRepository } from '../../../domain-server/repositories/IAIProviderConfigRepository';
import type {
  KnowledgeExpansionResult,
  IAIExecutionLogPort,
  IKnowledgeQueryPort,
} from '../../ports';
import type { ExpandKnowledgeReq, ExpandKnowledgeRes } from '@dailyuse/contracts/ai';
import { AIKnowledgeIndexService } from './ai-knowledge-index.service';
import {
  attachRequestIdToError,
  classifyAIExecutionError,
  createAIRequestId,
  withAICostEstimate,
} from './ai-observability';
import {
  resolveActiveProviderConfig,
  toChatExecutionProviderConfig,
} from './ai-provider-resolution';

const logger = createLogger('AIKnowledgeQueryService');

export class AIKnowledgeQueryService {
  constructor(
    private readonly providerConfigRepository: IAIProviderConfigRepository,
    private readonly knowledgeIndexService: AIKnowledgeIndexService,
    private readonly knowledgeQueryPort: IKnowledgeQueryPort,
    private readonly executionLogPort?: IAIExecutionLogPort,
  ) {}

  async queryKnowledge(
    identityId: string,
    request: QueryKnowledgeReq,
  ): Promise<QueryKnowledgeRes> {
    const startedAt = Date.now();
    const requestId = createAIRequestId();
    let providerMetadata: {
      providerId?: string;
      providerName?: string;
      model?: string;
    } = {};

    try {
      const provider = await resolveActiveProviderConfig(
        this.providerConfigRepository,
        identityId,
        request.providerId,
      );
      const executionProviderConfig = toChatExecutionProviderConfig(provider, {
        temperature: 0.2,
      });
      providerMetadata = {
        providerId: provider.id,
        providerName: provider.name,
        model: executionProviderConfig.model,
      };
      const sync = await this.knowledgeIndexService.syncRelevantKnowledge(
        identityId,
        request.query,
        request.maxResources ?? 8,
        {
          requestId,
          providerConfig: executionProviderConfig,
        },
      );

      if (sync.resources.length === 0 || sync.sync.indexedResources.length === 0) {
        const emptyResult: QueryKnowledgeRes = {
          answer: 'No relevant repository resources were found for this question.',
          citations: [],
          providerId: provider.id,
          tokenUsage: {
            promptTokens: 0,
            completionTokens: 0,
            totalTokens: 0,
          },
          processingTimeMs: Date.now() - startedAt,
          matchedResourceCount: 0,
        };

        await this.recordExecution({
          identityId,
          taskType: 'KNOWLEDGE_QUERY',
          status: 'COMPLETED',
          requestId,
          ...providerMetadata,
          input: {
            query: request.query,
            selectedProviderId: request.providerId,
            maxResources: request.maxResources,
          },
          result: {
            matchedResourceCount: emptyResult.matchedResourceCount,
            citationCount: emptyResult.citations.length,
            answer: emptyResult.answer,
          },
          tokenUsage: emptyResult.tokenUsage,
          processingMs: emptyResult.processingTimeMs,
        });
        return emptyResult;
      }

      const result = await this.knowledgeQueryPort.query({
        identityId,
        providerConfig: executionProviderConfig,
        question: request.query,
        indexedResources: sync.sync.indexedResources,
        maxCitations: 3,
        requestId,
      });

      const response: QueryKnowledgeRes = {
        answer: result.answer,
        citations: result.citations,
        providerId: provider.id,
        tokenUsage: result.usage,
        processingTimeMs: Date.now() - startedAt,
        matchedResourceCount: sync.resources.length,
      };

      await this.recordExecution({
        identityId,
        taskType: 'KNOWLEDGE_QUERY',
        status: 'COMPLETED',
        requestId,
        ...providerMetadata,
        input: {
          query: request.query,
          selectedProviderId: request.providerId,
          maxResources: request.maxResources,
        },
        result: {
          matchedResourceCount: response.matchedResourceCount,
          citationCount: response.citations.length,
          answer: response.answer,
        },
        tokenUsage: response.tokenUsage,
        processingMs: response.processingTimeMs,
      });
      return response;
    } catch (error) {
      await this.recordExecution({
        identityId,
        taskType: 'KNOWLEDGE_QUERY',
        status: 'FAILED',
        requestId,
        ...providerMetadata,
        errorCategory: classifyAIExecutionError(error),
        input: {
          query: request.query,
          selectedProviderId: request.providerId,
          maxResources: request.maxResources,
        },
        error: error instanceof Error ? error.message : 'Knowledge query failed',
        processingMs: Date.now() - startedAt,
      });
      logger.error('Knowledge query failed', {
        error,
        identityId,
        requestId,
      });
      throw attachRequestIdToError(error, requestId);
    }
  }

  async expandKnowledge(
    identityId: string,
    request: ExpandKnowledgeReq,
  ): Promise<ExpandKnowledgeRes> {
    const startedAt = Date.now();
    const requestId = createAIRequestId();
    let providerMetadata: {
      providerId?: string;
      providerName?: string;
      model?: string;
    } = {};

    try {
      const provider = await resolveActiveProviderConfig(
        this.providerConfigRepository,
        identityId,
        request.providerId,
      );
      const executionProviderConfig = toChatExecutionProviderConfig(provider, {
        temperature: 0.2,
      });
      providerMetadata = {
        providerId: provider.id,
        providerName: provider.name,
        model: executionProviderConfig.model,
      };
      const retrievalQuery = [request.instruction, request.currentContent]
        .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
        .join('\n\n');
      const sync = await this.knowledgeIndexService.syncRelevantKnowledge(
        identityId,
        retrievalQuery,
        request.maxResources ?? 8,
        {
          requestId,
          providerConfig: executionProviderConfig,
        },
      );

      const result: KnowledgeExpansionResult = await this.knowledgeQueryPort.expand({
        identityId,
        providerConfig: executionProviderConfig,
        instruction: request.instruction,
        currentContent: request.currentContent,
        indexedResources: sync.sync.indexedResources,
        maxCitations: request.maxCitations ?? 4,
        requestId,
      });

      const response: ExpandKnowledgeRes = {
        expandedContent: result.expandedContent,
        citations: result.citations,
        providerId: provider.id,
        tokenUsage: result.usage,
        processingTimeMs: Date.now() - startedAt,
        matchedResourceCount: sync.resources.length,
      };

      await this.recordExecution({
        identityId,
        taskType: 'KNOWLEDGE_QUERY',
        status: 'COMPLETED',
        requestId,
        ...providerMetadata,
        input: {
          instruction: request.instruction,
          currentContent: request.currentContent,
          maxResources: request.maxResources,
          maxCitations: request.maxCitations,
          mode: 'expand',
        },
        result: {
          matchedResourceCount: response.matchedResourceCount,
          citationCount: response.citations.length,
          expandedContent: response.expandedContent,
        },
        tokenUsage: response.tokenUsage,
        processingMs: response.processingTimeMs,
      });
      return response;
    } catch (error) {
      await this.recordExecution({
        identityId,
        taskType: 'KNOWLEDGE_QUERY',
        status: 'FAILED',
        requestId,
        ...providerMetadata,
        errorCategory: classifyAIExecutionError(error),
        input: {
          instruction: request.instruction,
          currentContent: request.currentContent,
          maxResources: request.maxResources,
          maxCitations: request.maxCitations,
          mode: 'expand',
        },
        error: error instanceof Error ? error.message : 'Knowledge expansion failed',
        processingMs: Date.now() - startedAt,
      });
      logger.error('Knowledge expansion failed', {
        error,
        identityId,
        requestId,
      });
      throw attachRequestIdToError(error, requestId);
    }
  }

  async reindexKnowledge(
    identityId: string,
    request: ReindexKnowledgeReq,
  ): Promise<ReindexKnowledgeRes> {
    const requestId = createAIRequestId();

    try {
      const provider = await resolveActiveProviderConfig(
        this.providerConfigRepository,
        identityId,
      );
      const executionProviderConfig = toChatExecutionProviderConfig(provider, {
        temperature: 0.2,
      });
      const sync = await this.knowledgeIndexService.reindexAllKnowledge(
        identityId,
        request.limit ?? 200,
        {
          force: request.force ?? false,
          requestId,
          providerConfig: executionProviderConfig,
        },
      );

      return {
        indexedCount: sync.indexedCount,
        reusedCount: sync.reusedCount,
        failedCount: sync.failedCount,
        results: sync.results,
      };
    } catch (error) {
      logger.error('Knowledge reindex failed', {
        error,
        identityId,
        requestId,
      });
      throw attachRequestIdToError(error, requestId);
    }
  }

  private async recordExecution(
    input: Parameters<NonNullable<IAIExecutionLogPort['record']>>[0],
  ): Promise<void> {
    if (!this.executionLogPort) {
      return;
    }

    try {
      await this.executionLogPort.record(withAICostEstimate(input));
    } catch (error) {
      logger.warn('Failed to record knowledge query execution log', {
        error,
        identityId: input.identityId,
      });
    }
  }
}
