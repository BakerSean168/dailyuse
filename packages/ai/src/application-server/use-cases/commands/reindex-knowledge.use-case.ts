import type { Result } from '@dailyuse/contracts/result';
import { ok, error } from '@dailyuse/contracts/result';
import type { ExecutionContext } from '@dailyuse/contracts/shared';
import type {
  ReindexKnowledgeReq,
  ReindexKnowledgeRes,
} from '@dailyuse/contracts/ai';
import { createLogger } from '@dailyuse/utils';

import type { IAIProviderConfigRepository } from '../../../domain-server/repositories/i-ai-provider-config-repository';
import type { ReindexAllKnowledgeUseCase } from './reindex-all-knowledge.use-case';
import {
  attachRequestIdToError,
  createAIRequestId,
} from './ai-observability';
import {
  resolveActiveProviderConfig,
  toChatExecutionProviderConfig,
} from './ai-provider-resolution';

const logger = createLogger('ReindexKnowledgeUseCase');

/**
 * 重建知识索引
 */
export class ReindexKnowledgeUseCase {
  constructor(
    private readonly providerConfigRepository: IAIProviderConfigRepository,
    private readonly knowledgeIndexService: ReindexAllKnowledgeUseCase,
  ) {}

  async execute(
    request: ReindexKnowledgeReq,
    cx: ExecutionContext,
  ): Promise<Result<ReindexKnowledgeRes>> {
    const requestId = createAIRequestId();

    try {
      const provider = await resolveActiveProviderConfig(
        this.providerConfigRepository,
        cx.identityId,
      );
      const executionProviderConfig = toChatExecutionProviderConfig(provider, {
        temperature: 0.2,
      });
      const sync = await this.knowledgeIndexService.execute(
        cx,
        request.limit ?? 200,
        {
          force: request.force ?? false,
          requestId,
          providerConfig: executionProviderConfig,
        },
      );

      return ok({
        indexedCount: sync.indexedCount,
        reusedCount: sync.reusedCount,
        failedCount: sync.failedCount,
        results: sync.results,
      });
    } catch (err) {
      logger.error('Knowledge reindex failed', {
        error: err,
        identityId: cx.identityId,
        requestId,
      });
      const enriched = attachRequestIdToError(err, requestId);
      return error('INTERNAL_ERROR', enriched.message);
    }
  }
}
