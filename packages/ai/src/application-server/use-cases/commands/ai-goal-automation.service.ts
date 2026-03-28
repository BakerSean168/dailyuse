import type {
  GenerateGoalAutomationReq,
  GenerateGoalAutomationRes,
  GoalAutomationAction,
} from '@dailyuse/contracts/ai';
import { createLogger } from '@dailyuse/utils';

import type { IAIProviderConfigRepository } from '../../../domain-server/repositories/IAIProviderConfigRepository';
import type {
  IAIExecutionLogPort,
  IAIAutomationToolExecutorPort,
  IGoalAutomationPlanningPort,
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

const logger = createLogger('AIGoalAutomationService');
const SIDE_EFFECT_TOOLS = new Set<GoalAutomationAction['tool']>([
  'create_goal',
  'create_key_result',
  'create_task_template',
]);

export class AIGoalAutomationService {
  constructor(
    private readonly providerConfigRepository: IAIProviderConfigRepository,
    private readonly planningPort: IGoalAutomationPlanningPort,
    private readonly toolExecutorPort: IAIAutomationToolExecutorPort,
    private readonly executionLogPort?: IAIExecutionLogPort,
  ) {}

  async automateGoal(
    identityId: string,
    request: GenerateGoalAutomationReq,
  ): Promise<GenerateGoalAutomationRes> {
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
      const approvedPlan =
        request.confirm === true && request.approvedPlan && request.approvedActions?.length
          ? {
              summary: request.approvedSummary ?? 'Executing approved automation plan.',
              goal: request.approvedPlan.goal,
              keyResults: request.approvedPlan.keyResults,
              taskTemplates: request.approvedPlan.taskTemplates,
              actions: request.approvedActions,
              usage: {
                promptTokens: 0,
                completionTokens: 0,
                totalTokens: 0,
              },
            }
          : null;
      const plan =
        approvedPlan ??
        (await this.planningPort.plan({
          identityId,
          providerConfig: executionProviderConfig,
          idea: request.idea,
          category: request.category,
          timeframe: request.timeframe,
          includeKeyResults: request.includeKeyResults ?? true,
          includeTaskTemplates: request.includeTaskTemplates ?? true,
          requestId,
        }));

      const requiresConfirmation = plan.actions.some((action) => SIDE_EFFECT_TOOLS.has(action.tool));
      const shouldExecute = !requiresConfirmation || request.confirm === true;
      const executedActions = shouldExecute
        ? await this.toolExecutorPort.executeGoalAutomation({
            identityId,
            request: {
              idea: request.idea,
              category: request.category,
              timeframe: request.timeframe,
            },
            plan: {
              goal: plan.goal,
              keyResults: plan.keyResults,
              taskTemplates: plan.taskTemplates,
            },
            actions: plan.actions,
          })
        : undefined;

      const response: GenerateGoalAutomationRes = {
        summary: plan.summary,
        requiresConfirmation: requiresConfirmation && request.confirm !== true,
        plan: {
          goal: plan.goal,
          keyResults: plan.keyResults,
          taskTemplates: plan.taskTemplates,
        },
        actions: plan.actions,
        executedActions,
        providerId: provider.id,
        tokenUsage: plan.usage,
        processingTimeMs: Date.now() - startedAt,
      };

      await this.recordExecution({
        identityId,
        taskType: response.executedActions ? 'GOAL_AUTOMATION_EXECUTE' : 'GOAL_AUTOMATION_PLAN',
        status: 'COMPLETED',
        requestId,
        ...providerMetadata,
        input: {
          idea: request.idea,
          category: request.category,
          timeframe: request.timeframe,
          includeKeyResults: request.includeKeyResults,
          includeTaskTemplates: request.includeTaskTemplates,
          confirm: request.confirm,
          approvedSummary: request.approvedSummary,
          approvedPlanProvided: Boolean(request.approvedPlan),
          approvedActionsProvided: Boolean(request.approvedActions?.length),
          selectedProviderId: request.providerId,
        },
        result: {
          actionCount: response.actions.length,
          requiresConfirmation: response.requiresConfirmation,
          executedCount: response.executedActions?.length ?? 0,
          summary: response.summary,
        },
        tokenUsage: response.tokenUsage,
        processingMs: response.processingTimeMs,
      });
      return response;
    } catch (error) {
      await this.recordExecution({
        identityId,
        taskType: request.confirm ? 'GOAL_AUTOMATION_EXECUTE' : 'GOAL_AUTOMATION_PLAN',
        status: 'FAILED',
        requestId,
        ...providerMetadata,
        errorCategory: classifyAIExecutionError(error),
        input: {
          idea: request.idea,
          category: request.category,
          timeframe: request.timeframe,
          includeKeyResults: request.includeKeyResults,
          includeTaskTemplates: request.includeTaskTemplates,
          confirm: request.confirm,
          approvedSummary: request.approvedSummary,
          approvedPlanProvided: Boolean(request.approvedPlan),
          approvedActionsProvided: Boolean(request.approvedActions?.length),
          selectedProviderId: request.providerId,
        },
        error: error instanceof Error ? error.message : 'Goal automation failed',
        processingMs: Date.now() - startedAt,
      });
      logger.error('Goal automation failed', {
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
      logger.warn('Failed to record goal automation execution log', {
        error,
        identityId: input.identityId,
      });
    }
  }
}
