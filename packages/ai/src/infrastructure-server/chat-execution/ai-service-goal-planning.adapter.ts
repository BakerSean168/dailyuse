import type {
  GoalPlanningInput,
  GoalPlanningResult,
  IGoalPlanningPort,
} from '../../application-server/ports';
import type { AIServiceInternalClientOptions } from './ai-service-internal-client';
import { AIServiceInternalClient } from './ai-service-internal-client';

interface AIServiceGoalPlanningResponse {
  state?: GoalPlanningResult['state'];
  goal?: Extract<GoalPlanningResult, { state: 'draft' }>['goal'];
  keyResults?: Extract<GoalPlanningResult, { state: 'draft' }>['keyResults'];
  clarification?: Extract<GoalPlanningResult, { state: 'clarification' }>['clarification'];
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  } | null;
}

export class AIServiceGoalPlanningAdapter implements IGoalPlanningPort {
  private readonly client: AIServiceInternalClient;

  constructor(options: AIServiceInternalClientOptions) {
    this.client = new AIServiceInternalClient(options);
  }

  async plan(input: GoalPlanningInput): Promise<GoalPlanningResult> {
    const payload = await this.client.postJson<
      AIServiceGoalPlanningResponse,
      {
        idea: string;
        category?: string;
        timeframe?: string;
        include_key_results: boolean;
        clarification_answers?: string[];
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
      path: '/internal/workflows/goal',
      identityId: input.identityId,
      requestId: input.requestId,
      body: {
        idea: input.idea,
        category: input.category,
        timeframe: input.timeframe,
        include_key_results: input.includeKeyResults,
        clarification_answers: input.clarificationAnswers,
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

    const usage = {
      promptTokens: payload.usage?.prompt_tokens ?? 0,
      completionTokens: payload.usage?.completion_tokens ?? 0,
      totalTokens:
        payload.usage?.total_tokens ??
        (payload.usage?.prompt_tokens ?? 0) + (payload.usage?.completion_tokens ?? 0),
    };

    if (payload.state === 'clarification' && payload.clarification) {
      return {
        state: 'clarification',
        clarification: payload.clarification,
        usage,
      };
    }

    if (!payload.goal) {
      throw new Error('ai-service goal planning returned no goal draft payload');
    }

    return {
      state: 'draft',
      goal: payload.goal,
      keyResults: payload.keyResults,
      usage,
    };
  }
}
