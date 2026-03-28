import type { QueryAnalyticsReq, QueryAnalyticsRes } from '@dailyuse/contracts/ai';
import { createLogger } from '@dailyuse/utils';

import type { IAIProviderConfigRepository } from '../../../domain-server/repositories/IAIProviderConfigRepository';
import type {
  IAIExecutionLogPort,
  IAnalyticsQueryPort,
  IAnalyticsReadPort,
} from '../../ports';
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

const logger = createLogger('AIAnalyticsQueryService');

export class AIAnalyticsQueryService {
  constructor(
    private readonly providerConfigRepository: IAIProviderConfigRepository,
    private readonly analyticsReadPort: IAnalyticsReadPort,
    private readonly analyticsQueryPort: IAnalyticsQueryPort,
    private readonly executionLogPort?: IAIExecutionLogPort,
  ) {}

  async queryAnalytics(
    identityId: string,
    request: QueryAnalyticsReq,
  ): Promise<QueryAnalyticsRes> {
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
      const context = await this.analyticsReadPort.buildContext(identityId, request.query);
      const result = await this.analyticsQueryPort.query({
        identityId,
        providerConfig: executionProviderConfig,
        question: request.query,
        context,
        requestId,
      });

      const response: QueryAnalyticsRes = {
        answer: result.answer,
        highlights: result.highlights,
        providerId: provider.id,
        tokenUsage: result.usage,
        processingTimeMs: Date.now() - startedAt,
      };

      await this.recordExecution({
        identityId,
        taskType: 'ANALYTICS_QUERY',
        status: 'COMPLETED',
        requestId,
        ...providerMetadata,
        input: {
          query: request.query,
          selectedProviderId: request.providerId,
        },
        result: {
          answer: response.answer,
          highlights: response.highlights,
        },
        tokenUsage: response.tokenUsage,
        processingMs: response.processingTimeMs,
      });

      return response;
    } catch (error) {
      await this.recordExecution({
        identityId,
        taskType: 'ANALYTICS_QUERY',
        status: 'FAILED',
        requestId,
        ...providerMetadata,
        errorCategory: classifyAIExecutionError(error),
        input: {
          query: request.query,
          selectedProviderId: request.providerId,
        },
        error: error instanceof Error ? error.message : 'Analytics query failed',
        processingMs: Date.now() - startedAt,
      });
      logger.error('Analytics query failed', {
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
      logger.warn('Failed to record analytics execution log', {
        error,
        identityId: input.identityId,
      });
    }
  }
}
