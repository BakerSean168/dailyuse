import {
  type GenerateGoalsReq,
  type GenerateGoalsRes,
} from '@dailyuse/contracts/ai';
import { createLogger } from '@dailyuse/utils';

import type { IAIProviderConfigRepository } from '../../../domain-server/repositories/IAIProviderConfigRepository';
import type { IAIExecutionLogPort, IGoalPlanningPort } from '../../ports';
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

const logger = createLogger('GoalGenerationApplicationService');

/**
 * GoalGenerationApplicationService
 *
 * This service used to return a static placeholder result. It now routes goal
 * drafting through the same execution port used by chat so API and Electron
 * can share one AI integration strategy.
 */
export class GoalGenerationApplicationService {
  constructor(
    private readonly providerConfigRepository: IAIProviderConfigRepository,
    private readonly goalPlanningPort: IGoalPlanningPort,
    private readonly executionLogPort?: IAIExecutionLogPort,
  ) {}

  async generateGoal(params: GenerateGoalsReq & { identityId: string }): Promise<GenerateGoalsRes> {
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
        params.identityId,
        params.providerId,
      );
      const executionProviderConfig = toChatExecutionProviderConfig(provider, {
        temperature: 0.3,
      });
      providerMetadata = {
        providerId: provider.id,
        providerName: provider.name,
        model: executionProviderConfig.model,
      };

      const planning = await this.goalPlanningPort.plan({
        identityId: params.identityId,
        providerConfig: executionProviderConfig,
        idea: params.idea,
        category: params.category,
        timeframe: params.timeframe,
        includeKeyResults: params.includeKeyResults ?? true,
        requestId,
      });

      const result = {
        goal: planning.goal,
        keyResults: planning.keyResults,
        tokenUsage: planning.usage,
        providerId: provider.id,
        processingTimeMs: Date.now() - startedAt,
        generatedAt: Date.now(),
        providerUsed: provider.name,
        modelUsed: executionProviderConfig.model,
      };

      await this.recordExecution({
        identityId: params.identityId,
        taskType: 'GOAL_GENERATION',
        status: 'COMPLETED',
        requestId,
        ...providerMetadata,
        input: {
          idea: params.idea,
          category: params.category,
          timeframe: params.timeframe,
          includeKeyResults: params.includeKeyResults ?? true,
          selectedProviderId: params.providerId,
        },
        result: {
          goalTitle: result.goal.title,
          keyResultCount: result.keyResults?.length ?? 0,
        },
        tokenUsage: result.tokenUsage,
        processingMs: result.processingTimeMs,
      });

      return result;
    } catch (error) {
      await this.recordExecution({
        identityId: params.identityId,
        taskType: 'GOAL_GENERATION',
        status: 'FAILED',
        requestId,
        ...providerMetadata,
        errorCategory: classifyAIExecutionError(error),
        input: {
          idea: params.idea,
          category: params.category,
          timeframe: params.timeframe,
          includeKeyResults: params.includeKeyResults ?? true,
          selectedProviderId: params.providerId,
        },
        error: error instanceof Error ? error.message : 'Goal generation failed',
        processingMs: Date.now() - startedAt,
      });
      logger.error('Goal generation failed', {
        error,
        identityId: params.identityId,
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
      logger.warn('Failed to record goal generation execution log', {
        error,
        identityId: input.identityId,
      });
    }
  }
}
