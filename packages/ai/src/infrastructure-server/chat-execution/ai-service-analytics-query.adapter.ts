import type {
  AnalyticsQueryInput,
  AnalyticsQueryResult,
  IAnalyticsQueryPort,
} from '../../application-server/ports';
import type { AIServiceInternalClientOptions } from './ai-service-internal-client';
import { AIServiceInternalClient } from './ai-service-internal-client';

interface AIServiceAnalyticsQueryResponse {
  answer: string;
  highlights?: string[];
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  } | null;
}

export class AIServiceAnalyticsQueryAdapter implements IAnalyticsQueryPort {
  private readonly client: AIServiceInternalClient;

  constructor(options: AIServiceInternalClientOptions) {
    this.client = new AIServiceInternalClient(options);
  }

  async query(input: AnalyticsQueryInput): Promise<AnalyticsQueryResult> {
    const payload = await this.client.postJson<
      AIServiceAnalyticsQueryResponse,
      {
        question: string;
        context: {
          dashboard?: Record<string, unknown>;
          task_dashboard?: Record<string, unknown>;
          goals: Array<Record<string, unknown>>;
          goal_search_results: Array<Record<string, unknown>>;
          extra: Record<string, unknown>;
        };
        provider_config: {
          provider: string;
          model: string;
          api_key: string;
          base_url?: string;
          temperature?: number;
          max_tokens?: number;
        };
        request_id?: string;
      }
    >({
      path: '/internal/workflows/analytics',
      identityId: input.identityId,
      requestId: input.requestId,
      body: {
        question: input.question,
        context: {
          dashboard: input.context.dashboard,
          task_dashboard: input.context.taskDashboard,
          goals: input.context.goals,
          goal_search_results: input.context.goalSearchResults,
          extra: input.context.extra,
        },
        provider_config: {
          provider: input.providerConfig.provider,
          model: input.providerConfig.model,
          api_key: input.providerConfig.apiKey,
          base_url: input.providerConfig.baseUrl,
          temperature: input.providerConfig.temperature,
          max_tokens: input.providerConfig.maxTokens,
        },
        request_id: input.requestId,
      },
    });

    return {
      answer: payload.answer,
      highlights: payload.highlights ?? [],
      usage: {
        promptTokens: payload.usage?.prompt_tokens ?? 0,
        completionTokens: payload.usage?.completion_tokens ?? 0,
        totalTokens:
          payload.usage?.total_tokens ??
          (payload.usage?.prompt_tokens ?? 0) +
            (payload.usage?.completion_tokens ?? 0),
      },
    };
  }
}
