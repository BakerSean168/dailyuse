/**
 * Shared runtime types for the AI module split.
 * AI 模块运行时拆分的共享类型。
 *
 * Each runtime (direct-provider, remote-ai-service) produces this shape.
 * `createAIModule()` consumes it without caring which runtime produced it.
 */

import type { AICapabilities } from '@dailyuse/contracts/ai';
import { error } from '@dailyuse/contracts/result';
import type { Result } from '@dailyuse/contracts/result';
import type { ExecutionContext } from '@dailyuse/contracts/shared';
import type {
  CreateKnowledgeNoteReq,
  CreateKnowledgeNoteRes,
  ExpandKnowledgeReq,
  ExpandKnowledgeRes,
  GetAIEvaluationOverviewReq,
  GetAIEvaluationOverviewRes,
  QueryAnalyticsReq,
  QueryAnalyticsRes,
  QueryKnowledgeReq,
  QueryKnowledgeRes,
  ReindexKnowledgeReq,
  ReindexKnowledgeRes,
} from '@dailyuse/contracts/ai';
import type {
  AIModuleRuntimeContribution,
  AIModuleServices,
  AIKnowledgeNoteService,
  AIKnowledgeQueryServices,
  AIAnalyticsQueryService,
  AIEvaluationReportService,
} from '../ai.module';
import type {
  ManageAIEvaluationReportUseCase,
  ManageAIKnowledgeNoteUseCase,
  QueryAIAnalyticsUseCase,
  QueryKnowledgeUseCase,
  ExpandKnowledgeUseCase,
  ReindexKnowledgeUseCase,
} from '../../application-server/use-cases';

/**
 * Output shape produced by both direct-provider and remote-ai-service runtimes.
 * 运行时产出的统一形状。
 */
export interface AIRuntimeOutput {
  readonly services: AIModuleServices;
  readonly capabilities: AICapabilities;
  readonly runtimeContributions: readonly AIModuleRuntimeContribution[];
}

export function buildCapabilityUnavailableMessage(
  capabilityLabel: string,
  capabilities: AICapabilities,
): string {
  if (capabilities.advancedFeaturesReason) {
    return `${capabilityLabel} is unavailable. ${capabilities.advancedFeaturesReason}`;
  }

  return `${capabilityLabel} is unavailable in the current AI runtime.`;
}

function unavailableResult<T>(message: string): Promise<Result<T>> {
  return Promise.resolve(error('SERVICE_UNAVAILABLE', message));
}

export function createKnowledgeNoteRuntimeService(
  service: ManageAIKnowledgeNoteUseCase | null,
): AIKnowledgeNoteService {
  return {
    isAvailable: Boolean(service),
    createKnowledgeNote(
      req: CreateKnowledgeNoteReq,
      cx: ExecutionContext,
    ): Promise<Result<CreateKnowledgeNoteRes>> {
      if (!service) {
        return unavailableResult(
          'Knowledge-note persistence was not provided to createAIModule. 知识笔记持久化端口未注入到 createAIModule。',
        );
      }

      return service.createKnowledgeNote(req, cx);
    },
  };
}

export function createKnowledgeQueryRuntimeServices(
  services: {
    query: QueryKnowledgeUseCase;
    expand: ExpandKnowledgeUseCase;
    reindex: ReindexKnowledgeUseCase;
  } | null,
  capabilities: AICapabilities,
): AIKnowledgeQueryServices {
  return {
    isAvailable: Boolean(services),
    query: {
      execute(
        req: QueryKnowledgeReq,
        cx: ExecutionContext,
      ): Promise<Result<QueryKnowledgeRes>> {
        return services
          ? services.query.execute(req, cx)
          : unavailableResult(
              buildCapabilityUnavailableMessage('Knowledge retrieval', capabilities),
            );
      },
    },
    expand: {
      execute(
        req: ExpandKnowledgeReq,
        cx: ExecutionContext,
      ): Promise<Result<ExpandKnowledgeRes>> {
        return services
          ? services.expand.execute(req, cx)
          : unavailableResult(
              buildCapabilityUnavailableMessage('Knowledge expansion', capabilities),
            );
      },
    },
    reindex: {
      execute(
        req: ReindexKnowledgeReq,
        cx: ExecutionContext,
      ): Promise<Result<ReindexKnowledgeRes>> {
        return services
          ? services.reindex.execute(req, cx)
          : unavailableResult(
              buildCapabilityUnavailableMessage('Knowledge reindexing', capabilities),
            );
      },
    },
  };
}

export function createAnalyticsRuntimeService(
  service: QueryAIAnalyticsUseCase | null,
  capabilities: AICapabilities,
): AIAnalyticsQueryService {
  return {
    isAvailable: Boolean(service),
    queryAnalytics(
      req: QueryAnalyticsReq,
      cx: ExecutionContext,
    ): Promise<Result<QueryAnalyticsRes>> {
      return service
        ? service.queryAnalytics(req, cx)
        : unavailableResult(buildCapabilityUnavailableMessage('Analytics query', capabilities));
    },
  };
}

export function createEvaluationRuntimeService(
  service: ManageAIEvaluationReportUseCase | null,
): AIEvaluationReportService {
  return {
    isAvailable: Boolean(service),
    getOverview(
      req: GetAIEvaluationOverviewReq = {},
    ): Promise<Result<GetAIEvaluationOverviewRes>> {
      return service
        ? service.getOverview(req)
        : unavailableResult('AI evaluation report access is unavailable.');
    },
  };
}
