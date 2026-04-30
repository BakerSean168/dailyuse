import type {
  GoalPlanningInput,
  GoalPlanningResult,
  IGoalPlanningPort,
} from '../../application-server/ports';
import { createLogger } from '@dailyuse/utils';
import type { AIServiceInternalClientOptions } from './ai-service-internal-client';
import { AIServiceInternalClient } from './ai-service-internal-client';

const logger = createLogger('AIServiceGoalPlanningAdapter');

function previewText(value: string | undefined, maxLength = 200): string | undefined {
  if (!value) {
    return undefined;
  }

  const normalized = value.replace(/\s+/g, ' ').trim();
  if (normalized.length <= maxLength) {
    return normalized;
  }
  return `${normalized.slice(0, maxLength - 3)}...`;
}

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
    logger.info('ai-service goal planning adapter request started', {
      identityId: input.identityId,
      requestId: input.requestId,
      ideaPreview: previewText(input.idea),
      category: input.category,
      timeframe: input.timeframe,
      includeKeyResults: input.includeKeyResults,
      clarificationAnswersCount: input.clarificationAnswers?.length ?? 0,
      provider: input.providerConfig.provider,
      model: input.providerConfig.model,
    });
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
      logger.info('ai-service goal planning adapter clarification response completed', {
        identityId: input.identityId,
        requestId: input.requestId,
        state: 'clarification',
        clarificationQuestionCount: payload.clarification.questions.length,
        usage,
      });
      return {
        state: 'clarification',
        clarification: payload.clarification,
        usage,
      };
    }

    if (!payload.goal) {
      logger.warn('ai-service goal planning adapter received no goal payload', {
        identityId: input.identityId,
        requestId: input.requestId,
        state: payload.state,
      });
      throw new Error('ai-service goal planning returned no goal draft payload');
    }

    logger.info('ai-service goal planning adapter response completed', {
      identityId: input.identityId,
      requestId: input.requestId,
      state: payload.state ?? 'draft',
      goalTitle: payload.goal.title,
      keyResultCount: payload.keyResults?.length ?? 0,
      usage,
    });

    return {
      state: 'draft',
      goal: payload.goal,
      keyResults: payload.keyResults,
      usage,
    };
  }
}
