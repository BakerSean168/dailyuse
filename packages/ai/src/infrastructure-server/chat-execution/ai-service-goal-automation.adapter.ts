import type {
  GoalAutomationPlanningInput,
  GoalAutomationPlanningResult,
  IGoalAutomationPlanningPort,
} from '../../application-server/ports';
import { createLogger } from '@dailyuse/utils';
import type { AIServiceInternalClientOptions } from './ai-service-internal-client';
import { AIServiceInternalClient } from './ai-service-internal-client';

const logger = createLogger('AIServiceGoalAutomationAdapter');

function previewText(value: string | undefined, maxLength = 220): string | undefined {
  if (!value) {
    return undefined;
  }

  const normalized = value.replace(/\s+/g, ' ').trim();
  if (normalized.length <= maxLength) {
    return normalized;
  }
  return `${normalized.slice(0, maxLength - 3)}...`;
}

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
    logger.info('ai-service goal automation adapter request started', {
      identityId: input.identityId,
      requestId: input.requestId,
      ideaPreview: previewText(input.idea),
      category: input.category,
      timeframe: input.timeframe,
      includeKeyResults: input.includeKeyResults,
      includeTaskTemplates: input.includeTaskTemplates,
      relatedResourceCount: input.relatedResources?.length ?? 0,
      hasAnalyticsContext: Boolean(input.analyticsContext),
      provider: input.providerConfig.provider,
      model: input.providerConfig.model,
    });
    const payload = await this.client.postJson<
      AIServiceGoalAutomationResponse,
      {
        idea: string;
        category?: string;
        timeframe?: string;
        include_key_results: boolean;
        include_task_templates: boolean;
        related_resources?: Array<{
          identity_id: string;
          repository_id: string;
          resource_id: string;
          resource_path: string;
          title?: string;
          mime_type: string;
          content: string;
          metadata?: Record<string, unknown>;
        }>;
        analytics_context?: {
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
      path: '/internal/workflows/goal-automation',
      identityId: input.identityId,
      requestId: input.requestId,
      body: {
        idea: input.idea,
        category: input.category,
        timeframe: input.timeframe,
        include_key_results: input.includeKeyResults,
        include_task_templates: input.includeTaskTemplates,
        related_resources: input.relatedResources?.map((resource) => ({
          identity_id: resource.identityId,
          repository_id: resource.repositoryId,
          resource_id: resource.resourceId,
          resource_path: resource.resourcePath,
          title: resource.title,
          mime_type: resource.mimeType,
          content: resource.content,
          metadata: resource.metadata,
        })),
        analytics_context: input.analyticsContext
          ? {
              dashboard: input.analyticsContext.dashboard,
              task_dashboard: input.analyticsContext.taskDashboard,
              goals: input.analyticsContext.goals,
              goal_search_results: input.analyticsContext.goalSearchResults,
              extra: input.analyticsContext.extra,
            }
          : undefined,
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

    logger.info('ai-service goal automation adapter response completed', {
      identityId: input.identityId,
      requestId: input.requestId,
      summary: previewText(payload.summary),
      goalTitle: payload.goal.title,
      keyResultCount: payload.keyResults?.length ?? 0,
      taskTemplateCount: payload.taskTemplates?.length ?? 0,
      actionCount: payload.toolCalls.length,
      actionTools: payload.toolCalls.map((action) => action.tool),
      usage,
    });

    return {
      summary: payload.summary,
      goal: payload.goal,
      keyResults: payload.keyResults,
      taskTemplates: payload.taskTemplates,
      actions: payload.toolCalls,
      usage,
    };
  }
}
