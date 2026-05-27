import type { Result } from '@dailyuse/contracts/result';
import { ok, error } from '@dailyuse/contracts/result';
import {
  type GenerateGoalsReq,
  type GenerateGoalsRes,
  type GoalAutomationAction,
  type GoalAutomationExecutedAction,
} from '@dailyuse/contracts/ai';
import { createLogger } from '@dailyuse/utils/logger';

import type { IAIProviderConfigRepository } from '../../../domain-server/repositories/i-ai-provider-config-repository';
import type {
  IAIAutomationToolExecutorPort,
  IAIExecutionLogPort,
  IAnalyticsReadPort,
  IGoalAutomationPlanningPort,
  IGoalPlanningPort,
  IKnowledgeSourcePort,
} from '../../ports';
import {
  resolveActiveProviderConfig,
  toChatExecutionProviderConfig,
} from './ai-provider-resolution';
import {
  attachRequestIdToError,
  classifyAIExecutionError,
  createAIRequestId,
  withAICostEstimate,
} from './ai-observability';

const logger = createLogger('GenerateAIGoalUseCase');
const SIDE_EFFECT_TOOLS = new Set<GoalAutomationAction['tool']>([
  'create_goal',
  'create_key_result',
  'create_task_template',
]);

function previewText(value: string | null | undefined, maxLength = 240): string | undefined {
  if (!value) {
    return undefined;
  }

  const normalized = value.replace(/\s+/g, ' ').trim();
  if (normalized.length <= maxLength) {
    return normalized;
  }
  return `${normalized.slice(0, maxLength - 3)}...`;
}

function summarizeProviderConfig(providerConfig: {
  provider: string;
  model: string;
  baseUrl?: string;
  temperature?: number;
  maxTokens?: number;
}) {
  return {
    provider: providerConfig.provider,
    model: providerConfig.model,
    baseUrl: providerConfig.baseUrl,
    temperature: providerConfig.temperature,
    maxTokens: providerConfig.maxTokens,
  };
}

function summarizeActions(actions: GoalAutomationAction[] | undefined) {
  return (actions ?? []).map((action) => ({
    tool: action.tool,
    index: action.index ?? null,
    rationale: previewText(action.rationale),
  }));
}

/**
 * GenerateAIGoalUseCase
 *
 * This service used to return a static placeholder result. It now routes goal
 * drafting through the same execution port used by chat so API and Electron
 * can share one AI integration strategy.
 */
export class GenerateAIGoalUseCase {
  constructor(
    private readonly providerConfigRepository: IAIProviderConfigRepository,
    private readonly goalPlanningPort: IGoalPlanningPort,
    private readonly goalAutomationPlanningPort?: IGoalAutomationPlanningPort,
    private readonly automationToolExecutorPort?: IAIAutomationToolExecutorPort,
    private readonly executionLogPort?: IAIExecutionLogPort,
    private readonly knowledgeSourcePort?: IKnowledgeSourcePort,
    private readonly analyticsReadPort?: IAnalyticsReadPort,
  ) {}

  async generateGoal(
    params: GenerateGoalsReq & { identityId: string; requestId?: string },
  ): Promise<Result<GenerateGoalsRes>> {
    const startedAt = Date.now();
    const requestId = params.requestId ?? createAIRequestId();
    let providerMetadata: {
      providerId?: string;
      providerName?: string;
      model?: string;
    } = {};

    try {
      logger.info('Goal flow request started', {
        identityId: params.identityId,
        requestId,
        command: params.command ?? 'draft',
        ideaPreview: previewText(params.idea),
        category: params.category,
        timeframe: params.timeframe,
        includeKeyResults: params.includeKeyResults ?? true,
        includeTaskTemplates: params.includeTaskTemplates ?? true,
        clarificationAnswersCount: params.clarificationAnswers?.length ?? 0,
        approvedActionsCount: params.approvedActions?.length ?? 0,
        hasDraftContext: Boolean(params.draftContext),
        hasApprovedPlan: Boolean(params.approvedPlan),
      });
      const provider = await resolveActiveProviderConfig(
        this.providerConfigRepository,
        params.identityId,
        params.providerId,
      );
      const executionProviderConfig = toChatExecutionProviderConfig(provider, {
        modelOverride: params.model,
        temperature: 0.3,
      });
      providerMetadata = {
        providerId: provider.id,
        providerName: provider.name,
        model: executionProviderConfig.model,
      };
      logger.info('Goal flow provider resolved', {
        identityId: params.identityId,
        requestId,
        providerId: provider.id,
        providerName: provider.name,
        providerConfig: summarizeProviderConfig(executionProviderConfig),
      });

      const result =
        params.command === 'prepare' || params.command === 'execute'
          ? await this.runGoalAutomationWorkflow({
              params,
              providerId: provider.id,
              providerName: provider.name,
              providerConfig: executionProviderConfig,
              model: executionProviderConfig.model,
              requestId,
              startedAt,
            })
          : await this.runGoalDraftWorkflow({
              params,
              providerId: provider.id,
              providerName: provider.name,
              providerConfig: executionProviderConfig,
              model: executionProviderConfig.model,
              requestId,
              startedAt,
            });

      logger.info('Goal flow request completed', {
        identityId: params.identityId,
        requestId,
        state: result.state,
        processingTimeMs: result.processingTimeMs,
        providerId: providerMetadata.providerId,
        model: providerMetadata.model,
        summary: 'summary' in result ? previewText(result.summary) : undefined,
        goalTitle:
          result.state === 'draft'
            ? result.goal.title
            : result.state === 'confirm' || result.state === 'result'
              ? result.plan.goal.title
              : undefined,
        keyResultCount:
          result.state === 'draft'
            ? result.keyResults?.length ?? 0
            : result.state === 'confirm' || result.state === 'result'
              ? result.plan.keyResults?.length ?? 0
              : undefined,
        actionCount:
          result.state === 'confirm' || result.state === 'result'
            ? result.actions.length
            : undefined,
        executionSummary: result.state === 'result' ? result.executionSummary : undefined,
      });

      await this.recordExecution({
        identityId: params.identityId,
        taskType:
          result.state === 'confirm'
            ? 'GOAL_AUTOMATION_PLAN'
            : result.state === 'result'
              ? 'GOAL_AUTOMATION_EXECUTE'
              : 'GOAL_GENERATION',
        status: 'COMPLETED',
        requestId,
        ...providerMetadata,
        input: {
          idea: params.idea,
          category: params.category,
          timeframe: params.timeframe,
          includeKeyResults: params.includeKeyResults ?? true,
          includeTaskTemplates: params.includeTaskTemplates,
          command: params.command ?? 'draft',
          clarificationAnswers: params.clarificationAnswers,
          draftContext: params.draftContext,
          approvedSummary: params.approvedSummary,
          approvedPlanProvided: Boolean(params.approvedPlan),
          approvedActionsProvided: Boolean(params.approvedActions?.length),
          selectedProviderId: params.providerId,
          selectedModel: params.model,
        },
        result:
          result.state === 'clarification'
            ? {
                state: result.state,
                clarificationQuestionCount: result.clarification.questions.length,
              }
            : result.state === 'draft'
              ? {
                  state: result.state,
                  goalTitle: result.goal.title,
                  keyResultCount: result.keyResults?.length ?? 0,
                }
              : {
                  state: result.state,
                  summary: result.summary,
                  actionCount: result.actions.length,
                  requiresConfirmation: result.state === 'confirm',
                  executedCount:
                    result.state === 'result' ? result.executedActions.length : 0,
                  executionStatus:
                    result.state === 'result' ? result.executionSummary.status : undefined,
                  failedCount:
                    result.state === 'result' ? result.executionSummary.failedCount : undefined,
                },
        tokenUsage: result.tokenUsage,
        processingMs: result.processingTimeMs,
      });

      return ok(result);
    } catch (err) {
      await this.recordExecution({
        identityId: params.identityId,
        taskType:
          params.command === 'prepare'
            ? 'GOAL_AUTOMATION_PLAN'
            : params.command === 'execute'
              ? 'GOAL_AUTOMATION_EXECUTE'
              : 'GOAL_GENERATION',
        status: 'FAILED',
        requestId,
        ...providerMetadata,
        errorCategory: classifyAIExecutionError(err),
        input: {
          idea: params.idea,
          category: params.category,
          timeframe: params.timeframe,
          includeKeyResults: params.includeKeyResults ?? true,
          includeTaskTemplates: params.includeTaskTemplates,
          command: params.command ?? 'draft',
          clarificationAnswers: params.clarificationAnswers,
          draftContext: params.draftContext,
          approvedSummary: params.approvedSummary,
          approvedPlanProvided: Boolean(params.approvedPlan),
          approvedActionsProvided: Boolean(params.approvedActions?.length),
          selectedProviderId: params.providerId,
          selectedModel: params.model,
        },
        error: err instanceof Error ? err.message : 'Goal generation failed',
        processingMs: Date.now() - startedAt,
      });
      logger.error('Goal generation failed', {
        error: err,
        identityId: params.identityId,
        requestId,
      });
      const enriched = attachRequestIdToError(err, requestId);
      return error('INTERNAL_ERROR', enriched.message);
    }
  }

  private async runGoalDraftWorkflow(input: {
    params: GenerateGoalsReq & { identityId: string };
    providerId: GenerateGoalsRes['providerId'];
    providerName: string;
    providerConfig: Parameters<IGoalPlanningPort['plan']>[0]['providerConfig'];
    model: string;
    requestId: string;
    startedAt: number;
  }): Promise<GenerateGoalsRes> {
    logger.info('Goal draft workflow started', {
      identityId: input.params.identityId,
      requestId: input.requestId,
      command: input.params.command ?? 'draft',
      ideaPreview: previewText(input.params.idea),
      category: input.params.category,
      timeframe: input.params.timeframe,
      includeKeyResults: input.params.includeKeyResults ?? true,
      clarificationAnswersCount: input.params.clarificationAnswers?.length ?? 0,
    });
    const planning = await this.goalPlanningPort.plan({
      identityId: input.params.identityId,
      providerConfig: input.providerConfig,
      idea: input.params.idea,
      category: input.params.category,
      timeframe: input.params.timeframe,
      includeKeyResults: input.params.includeKeyResults ?? true,
      clarificationAnswers: input.params.clarificationAnswers,
      requestId: input.requestId,
    });

    logger.info('Goal draft workflow received planning response', {
      identityId: input.params.identityId,
      requestId: input.requestId,
      state: planning.state,
      clarificationQuestionCount:
        planning.state === 'clarification' ? planning.clarification.questions.length : 0,
      goalTitle: planning.state === 'draft' ? planning.goal.title : undefined,
      keyResultCount: planning.state === 'draft' ? planning.keyResults?.length ?? 0 : undefined,
      usage: planning.usage,
    });

    return planning.state === 'clarification'
      ? {
          state: 'clarification',
          clarification: planning.clarification,
          tokenUsage: planning.usage,
          providerId: input.providerId,
          processingTimeMs: Date.now() - input.startedAt,
          generatedAt: Date.now(),
          providerUsed: input.providerName,
          modelUsed: input.model,
        }
      : {
          state: 'draft',
          goal: planning.goal,
          keyResults: planning.keyResults,
          tokenUsage: planning.usage,
          providerId: input.providerId,
          processingTimeMs: Date.now() - input.startedAt,
          generatedAt: Date.now(),
          providerUsed: input.providerName,
          modelUsed: input.model,
        };
  }

  private async runGoalAutomationWorkflow(input: {
    params: GenerateGoalsReq & { identityId: string };
    providerId: GenerateGoalsRes['providerId'];
    providerName: string;
    providerConfig: Parameters<IGoalPlanningPort['plan']>[0]['providerConfig'];
    model: string;
    requestId: string;
    startedAt: number;
  }): Promise<GenerateGoalsRes> {
    logger.info('Goal automation workflow started', {
      identityId: input.params.identityId,
      requestId: input.requestId,
      command: input.params.command,
      ideaPreview: previewText(input.params.idea),
      automationIdeaPreview: previewText(this.buildAutomationIdea(input.params)),
      category: input.params.category ?? input.params.draftContext?.goal.category,
      timeframe: input.params.timeframe,
      includeKeyResults: input.params.includeKeyResults ?? true,
      includeTaskTemplates: input.params.includeTaskTemplates ?? true,
      approvedActionsCount: input.params.approvedActions?.length ?? 0,
      hasApprovedPlan: Boolean(input.params.approvedPlan),
    });
    if (!this.goalAutomationPlanningPort || !this.automationToolExecutorPort) {
      throw new Error(
        'Goal automation is unavailable in the current AI runtime. Configure ai-service execution first.',
      );
    }

    if (input.params.command === 'execute') {
      if (!input.params.approvedPlan || !input.params.approvedActions?.length) {
        throw new Error('Approved automation plan and actions are required for execution.');
      }

      logger.info('Goal automation execute phase started', {
        identityId: input.params.identityId,
        requestId: input.requestId,
        approvedSummary: previewText(input.params.approvedSummary),
        actions: summarizeActions(input.params.approvedActions),
      });

      const executedActions = await this.automationToolExecutorPort.executeGoalAutomation({
        identityId: input.params.identityId,
        request: {
          idea: this.buildAutomationIdea(input.params),
          category: input.params.category,
          timeframe: input.params.timeframe,
        },
        plan: {
          goal: input.params.approvedPlan.goal,
          keyResults: input.params.approvedPlan.keyResults,
          taskTemplates: input.params.approvedPlan.taskTemplates,
        },
        actions: input.params.approvedActions,
      });

      logger.info('Goal automation execute phase completed', {
        identityId: input.params.identityId,
        requestId: input.requestId,
        executedActions,
        executionSummary: this.buildExecutionSummary(executedActions),
      });

      return {
        state: 'result',
        summary: input.params.approvedSummary ?? 'Executed approved automation plan.',
        plan: {
          goal: input.params.approvedPlan.goal,
          keyResults: input.params.approvedPlan.keyResults,
          taskTemplates: input.params.approvedPlan.taskTemplates,
        },
        actions: input.params.approvedActions,
        executedActions,
        tokenUsage: {
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0,
        },
        providerId: input.providerId,
        processingTimeMs: Date.now() - input.startedAt,
        generatedAt: Date.now(),
        providerUsed: input.providerName,
        modelUsed: input.model,
        executionSummary: this.buildExecutionSummary(executedActions),
        recovery: this.buildExecutionRecovery(executedActions),
      };
    }

    const automationIdea = this.buildAutomationIdea(input.params);
    const relatedResources = await this.loadRelatedKnowledgeResources(
      input.params.identityId,
      automationIdea,
    );
    const analyticsContext = await this.loadAnalyticsContext(
      input.params.identityId,
      automationIdea,
    );
    logger.info('Goal automation planning dependencies loaded', {
      identityId: input.params.identityId,
      requestId: input.requestId,
      relatedResourceCount: relatedResources?.length ?? 0,
      hasAnalyticsContext: Boolean(analyticsContext),
      analyticsGoalCount: analyticsContext?.goals?.length ?? 0,
    });

    const plan = await this.goalAutomationPlanningPort.plan({
      identityId: input.params.identityId,
      providerConfig: input.providerConfig,
      idea: automationIdea,
      category: input.params.category ?? input.params.draftContext?.goal.category,
      timeframe: input.params.timeframe,
      includeKeyResults: input.params.includeKeyResults ?? true,
      includeTaskTemplates: input.params.includeTaskTemplates ?? true,
      relatedResources,
      analyticsContext,
      requestId: input.requestId,
    });
    const requiresConfirmation = plan.actions.some((action) => SIDE_EFFECT_TOOLS.has(action.tool));

    logger.info('Goal automation plan received', {
      identityId: input.params.identityId,
      requestId: input.requestId,
      summary: previewText(plan.summary),
      goalTitle: plan.goal.title,
      keyResultCount: plan.keyResults?.length ?? 0,
      taskTemplateCount: plan.taskTemplates?.length ?? 0,
      actions: summarizeActions(plan.actions),
      requiresConfirmation,
      usage: plan.usage,
    });

    if (requiresConfirmation) {
      return {
        state: 'confirm',
        summary: plan.summary,
        plan: {
          goal: plan.goal,
          keyResults: plan.keyResults,
          taskTemplates: plan.taskTemplates,
        },
        actions: plan.actions,
        tokenUsage: plan.usage,
        providerId: input.providerId,
        processingTimeMs: Date.now() - input.startedAt,
        generatedAt: Date.now(),
        providerUsed: input.providerName,
        modelUsed: input.model,
      };
    }

    logger.info('Goal automation auto-execute started', {
      identityId: input.params.identityId,
      requestId: input.requestId,
      actions: summarizeActions(plan.actions),
    });
    const executedActions = await this.automationToolExecutorPort.executeGoalAutomation({
      identityId: input.params.identityId,
      request: {
        idea: automationIdea,
        category: input.params.category,
        timeframe: input.params.timeframe,
      },
      plan: {
        goal: plan.goal,
        keyResults: plan.keyResults,
        taskTemplates: plan.taskTemplates,
      },
      actions: plan.actions,
    });
    logger.info('Goal automation auto-execute completed', {
      identityId: input.params.identityId,
      requestId: input.requestId,
      executedActions,
      executionSummary: this.buildExecutionSummary(executedActions),
    });

    return {
      state: 'result',
      summary: plan.summary,
      plan: {
        goal: plan.goal,
        keyResults: plan.keyResults,
        taskTemplates: plan.taskTemplates,
      },
      actions: plan.actions,
      executedActions,
      tokenUsage: plan.usage,
      providerId: input.providerId,
      processingTimeMs: Date.now() - input.startedAt,
      generatedAt: Date.now(),
      providerUsed: input.providerName,
      modelUsed: input.model,
      executionSummary: this.buildExecutionSummary(executedActions),
      recovery: this.buildExecutionRecovery(executedActions),
    };
  }

  private buildAutomationIdea(params: GenerateGoalsReq): string {
    if (!params.draftContext) {
      return params.idea;
    }

    const goal = params.draftContext.goal;
    const lines = [
      `Goal title: ${goal.title}`,
      `Goal description: ${goal.description}`,
      goal.category ? `Category: ${goal.category}` : null,
      `Importance: ${goal.importance}`,
      goal.motivation ? `Motivation: ${goal.motivation}` : null,
      goal.feasibilityAnalysis ? `Feasibility analysis: ${goal.feasibilityAnalysis}` : null,
      goal.tags?.length ? `Tags: ${goal.tags.join(', ')}` : null,
      params.draftContext.keyResults?.length
        ? [
            'Key results:',
            ...params.draftContext.keyResults.map((item, index) => {
              const unit = item.unit ? ` ${item.unit}` : '';
              return `${index + 1}. ${item.title} | target=${item.targetValue}${unit}`;
            }),
          ].join('\n')
        : null,
    ];

    return lines.filter((item): item is string => Boolean(item)).join('\n');
  }

  private async recordExecution(
    input: Parameters<NonNullable<IAIExecutionLogPort['record']>>[0],
  ): Promise<void> {
    if (!this.executionLogPort) {
      return;
    }

    try {
      await this.executionLogPort.record(withAICostEstimate(input));
    } catch (err) {
      logger.warn('Failed to record goal generation execution log', {
        error: err,
        identityId: input.identityId,
      });
    }
  }

  private async loadRelatedKnowledgeResources(
    identityId: string,
    query: string,
  ) {
    if (!this.knowledgeSourcePort) {
      logger.info('Goal automation knowledge source unavailable', {
        identityId,
        queryPreview: previewText(query),
      });
      return undefined;
    }

    try {
      const resources = await this.knowledgeSourcePort.listRelevantResources(identityId, query, 6);
      logger.info('Goal automation knowledge resources loaded', {
        identityId,
        queryPreview: previewText(query),
        resourceCount: resources.length,
        resourcePaths: resources.map((resource) => resource.resourcePath),
      });
      return resources.length ? resources : undefined;
    } catch (err) {
      logger.warn('Failed to load related knowledge resources for goal automation planning', {
        error: err,
        identityId,
      });
      return undefined;
    }
  }

  private async loadAnalyticsContext(identityId: string, question: string) {
    if (!this.analyticsReadPort) {
      logger.info('Goal automation analytics context unavailable', {
        identityId,
        questionPreview: previewText(question),
      });
      return undefined;
    }

    try {
      const context = await this.analyticsReadPort.buildContext(identityId, question);
      logger.info('Goal automation analytics context loaded', {
        identityId,
        questionPreview: previewText(question),
        goalCount: context.goals.length,
        goalSearchResultCount: context.goalSearchResults.length,
        hasDashboard: Boolean(context.dashboard),
        hasTaskDashboard: Boolean(context.taskDashboard),
      });
      return context;
    } catch (err) {
      logger.warn('Failed to load analytics context for goal automation planning', {
        error: err,
        identityId,
      });
      return undefined;
    }
  }

  private buildExecutionSummary(
    executedActions: GoalAutomationExecutedAction[],
  ): Extract<GenerateGoalsRes, { state: 'result' }>['executionSummary'] {
    const executedCount = executedActions.filter((action) => action.status === 'executed').length;
    const skippedCount = executedActions.filter((action) => action.status === 'skipped').length;
    const failedCount = executedActions.filter((action) => action.status === 'failed').length;

    return {
      status:
        failedCount === 0
          ? 'success'
          : executedCount > 0 || skippedCount > 0
            ? 'partial'
            : 'failed',
      executedCount,
      skippedCount,
      failedCount,
    };
  }

  private buildExecutionRecovery(
    executedActions: GoalAutomationExecutedAction[],
  ): Extract<GenerateGoalsRes, { state: 'result' }>['recovery'] {
    const failedActions = executedActions.filter((action) => action.status === 'failed');
    const skippedActions = executedActions.filter((action) => action.status === 'skipped');
    const suggestions = new Set<string>();

    if (failedActions.some((action) => action.tool === 'create_goal')) {
      suggestions.add('Fix the goal creation error and rerun execute with the same approved plan.');
    }
    if (failedActions.some((action) => action.tool === 'create_key_result')) {
      suggestions.add(
        'Confirm the goal exists and the key result drafts are complete before retrying execution.',
      );
    }
    if (failedActions.some((action) => action.tool === 'create_task_template')) {
      suggestions.add(
        'Review task template drafts and task module configuration before retrying execution.',
      );
    }
    if (failedActions.some((action) => action.tool === 'search_notes')) {
      suggestions.add(
        'Refresh repository resources or narrow the note query before retrying execution.',
      );
    }
    if (failedActions.some((action) => action.tool === 'fetch_stats')) {
      suggestions.add(
        'Check analytics availability and rerun execute after the dashboard context is healthy.',
      );
    }
    if (skippedActions.length) {
      suggestions.add('Review skipped actions before rerunning execution.');
    }
    if (failedActions.length && suggestions.size === 0) {
      suggestions.add(
        'Review the failed action messages and rerun execute with the approved plan after fixing the underlying issue.',
      );
    }

    return {
      canRetry: failedActions.length > 0,
      failedActions,
      suggestions: [...suggestions],
    };
  }
}
