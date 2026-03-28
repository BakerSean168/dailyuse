import type {
  GoalAutomationPlanningInput,
  GoalAutomationPlanningResult,
  IGoalAutomationPlanningPort,
} from '../../application-server/ports';
import type { AIServiceInternalClientOptions } from './ai-service-internal-client';
import { AIServiceInternalClient } from './ai-service-internal-client';

interface AIServiceGoalAutomationResponse {
  summary: string;
  goal: GoalAutomationPlanningResult['goal'];
  keyResults?: GoalAutomationPlanningResult['keyResults'];
  taskTemplates?: GoalAutomationPlanningResult['taskTemplates'];
  toolCalls: GoalAutomationPlanningResult['actions'];
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  } | null;
}

export class AIServiceGoalAutomationAdapter implements IGoalAutomationPlanningPort {
  private readonly client: AIServiceInternalClient;

  constructor(options: AIServiceInternalClientOptions) {
    this.client = new AIServiceInternalClient(options);
  }

  async plan(input: GoalAutomationPlanningInput): Promise<GoalAutomationPlanningResult> {
    const payload = await this.client.postJson<
      AIServiceGoalAutomationResponse,
      {
        idea: string;
        category?: string;
        timeframe?: string;
        include_key_results: boolean;
        include_task_templates: boolean;
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
      path: '/internal/goals/plan-actions',
      identityId: input.identityId,
      requestId: input.requestId,
      body: {
        idea: input.idea,
        category: input.category,
        timeframe: input.timeframe,
        include_key_results: input.includeKeyResults,
        include_task_templates: input.includeTaskTemplates,
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
      summary: payload.summary,
      goal: payload.goal,
      keyResults: payload.keyResults,
      taskTemplates: payload.taskTemplates,
      actions: payload.toolCalls,
      usage: {
        promptTokens: payload.usage?.prompt_tokens ?? 0,
        completionTokens: payload.usage?.completion_tokens ?? 0,
        totalTokens:
          payload.usage?.total_tokens ??
          (payload.usage?.prompt_tokens ?? 0) + (payload.usage?.completion_tokens ?? 0),
      },
    };
  }
}
