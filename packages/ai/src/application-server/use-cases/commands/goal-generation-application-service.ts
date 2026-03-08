/**
 * Goal Generation Application Service - Simplified
 *
 * This is a simplified version to allow the API to build and run.
 * Full implementation with AI integration to be done in future refactoring.
 */

import { createLogger } from '@dailyuse/utils';
import { z } from 'zod';
import { AIProviderError, AIValidationError } from '../../../domain-server/errors/AIErrors';
import type {
  GeneratedGoalDraft,
  GenerateGoalResultDTO,
  GenerateKeyResultsResultDTO,
  KeyResultPreview,
  GenerateGoalDTO,
  GenerateKeyResultsDTO,
  AIProviderConfigServerDTO,
} from '@dailyuse/contracts/ai';
import { GoalCategory as GoalCategoryEnum } from '@dailyuse/contracts/ai';
import { ImportanceLevel as ImportanceLevelEnum } from '@dailyuse/contracts/shared';

// Aliases for compatibility
type GenerateGoalResponse = GenerateGoalResultDTO;
type GenerateGoalWithKRsResponse = GenerateGoalResultDTO;
type GenerateKeyResultsResponse = GenerateKeyResultsResultDTO;

const logger = createLogger('GoalGenerationApplicationService');

/**
 * Goal Generation Application Service
 *
 * Simplified implementation - uses dependency injection pattern
 * No singleton getInstance() method - use through DI containers
 */
export class GoalGenerationApplicationService {
  constructor(
    private readonly validationService: any,
    private readonly providerConfigRepository: any,
    private readonly quotaRepository: any,
    private readonly quotaEnforcementService: any,
  ) {}

  /**
   * Generate goal from user idea
   */
  async generateGoal(
    params: GenerateGoalDTO,
  ): Promise<GenerateGoalResponse | GenerateGoalWithKRsResponse> {
    const { identityId, idea, includeKeyResults } = params;

    logger.info('Generating goal from idea', {
      identityId,
      ideaLength: idea.length,
      includeKeyResults,
    });

    const startTime = Date.now();
    const providerConfig = await this.getProviderConfig(
      identityId,
      params.providerId ? String(params.providerId) : undefined,
    );
    const { content, tokenUsage } = await this.requestGoalGeneration(providerConfig, idea);
    const parsed = this.parseGoalResponse(content);

    const response: GenerateGoalResponse = {
      goal: {
        title: parsed.goal.title,
        description: parsed.goal.description,
        category: parsed.goal.category,
        importance: parsed.goal.importance,
        tags: parsed.goal.tags,
        suggestedStartDate: parsed.goal.suggestedStartDate,
        suggestedEndDate: parsed.goal.suggestedEndDate,
      },
      keyResults: parsed.keyResults,
      tokenUsage,
      generatedAt: Date.now(),
      providerId: providerConfig.id,
      processingTimeMs: Date.now() - startTime,
      providerUsed: providerConfig.name,
      modelUsed: providerConfig.defaultModel || undefined,
    };

    if (!includeKeyResults) {
      const { keyResults: _keyResults, ...withoutKeyResults } = response;
      return withoutKeyResults;
    }

    return response as GenerateGoalWithKRsResponse;
  }

  /**
   * Generate goal with key results
   */
  async generateGoalWithKRs(params: GenerateGoalDTO): Promise<GenerateGoalWithKRsResponse> {
    return this.generateGoal({
      ...params,
      includeKeyResults: true,
    }) as Promise<GenerateGoalWithKRsResponse>;
  }

  /**
   * Generate key results
   */
  async generateKeyResults(params: GenerateKeyResultsDTO): Promise<GenerateKeyResultsResponse> {
    const { identityId, goalTitle } = params;

    logger.info('Generating key results', {
      identityId,
      goalTitle,
    });

    const providerConfig = await this.getProviderConfig(
      identityId,
      params.providerId ? String(params.providerId) : undefined,
    );

    return {
      keyResults: [] as KeyResultPreview[],
      tokenUsage: {
        promptTokens: 10,
        completionTokens: 20,
        totalTokens: 30,
      },
      generatedAt: Date.now(),
      providerId: providerConfig.id,
      processingTimeMs: 0,
    };
  }

  private async getProviderConfig(
    identityId: string,
    providerId?: string,
  ): Promise<AIProviderConfigServerDTO> {
    if (providerId) {
      const byId = await this.providerConfigRepository.findById(providerId);
      if (byId && byId.isActive) {
        return byId;
      }
    }

    const defaultConfig = await this.providerConfigRepository.findDefaultByIdentityId(identityId);
    if (defaultConfig && defaultConfig.isActive) {
      return defaultConfig;
    }

    const providers = await this.providerConfigRepository.findByIdentityId(identityId);
    const activeProvider = providers.find((provider: any) => provider.isActive);
    if (!activeProvider) {
      throw new AIProviderError('Unknown', 'No AI provider configured');
    }

    return activeProvider;
  }

  private async requestGoalGeneration(
    config: AIProviderConfigServerDTO,
    idea: string,
  ): Promise<{
    content: string;
    tokenUsage: { promptTokens: number; completionTokens: number; totalTokens: number };
  }> {
    const systemPrompt = this.getSystemPrompt();
    const url = new URL('/v1/chat/completions', config.baseUrl);

    const controller = new AbortController();
    const timeoutMs = 60000;
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url.toString(), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: config.defaultModel || 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: idea },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.7,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new AIProviderError(config.name, `HTTP ${response.status}: ${errorText}`);
      }

      const json = await response.json();
      const content = json?.choices?.[0]?.message?.content;
      if (!content || typeof content !== 'string') {
        throw new AIProviderError(config.name, 'Empty response content');
      }

      const usage = json?.usage ?? {};
      const tokenUsage = {
        promptTokens: usage.prompt_tokens ?? 0,
        completionTokens: usage.completion_tokens ?? 0,
        totalTokens:
          usage.total_tokens ?? (usage.prompt_tokens ?? 0) + (usage.completion_tokens ?? 0),
      };

      return { content, tokenUsage };
    } catch (error) {
      if (error instanceof AIProviderError) {
        throw error;
      }
      if (error instanceof Error && error.name === 'AbortError') {
        throw new AIProviderError(config.name, 'Request timed out');
      }
      throw new AIProviderError(
        config.name,
        error instanceof Error ? error.message : 'Unknown error',
      );
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private parseGoalResponse(content: string): {
    goal: GeneratedGoalDraft;
    keyResults?: KeyResultPreview[];
  } {
    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch {
      throw new AIValidationError('Invalid JSON response', ['Response is not valid JSON']);
    }

    const now = Date.now();
    const schema = z.object({
      goal: z.object({
        title: z.string().min(3),
        description: z.string().min(3),
        category: z.nativeEnum(GoalCategoryEnum),
        importance: z.nativeEnum(ImportanceLevelEnum),
        tags: z.array(z.string()).default([]),
        suggestedStartDate: z.number().optional().default(now),
        suggestedEndDate: z
          .number()
          .optional()
          .default(now + 30 * 24 * 60 * 60 * 1000),
      }),
      keyResults: z
        .array(
          z.object({
            title: z.string().min(3),
            description: z.string().optional(),
            targetValue: z.number(),
            unit: z.string(),
          }),
        )
        .optional(),
    });

    const result = schema.safeParse(parsed);
    if (!result.success) {
      const errors = result.error.issues.map((issue) => issue.message);
      throw new AIValidationError('Goal generation validation failed', errors);
    }

    return result.data;
  }

  private getSystemPrompt(): string {
    return [
      'You are an OKR expert. Generate 1 SMART goal and 3 key results based on the user idea.',
      'Return ONLY valid JSON with this exact structure:',
      '{"goal":{"title":"...","description":"...","category":"personal","importance":"Moderate","tags":["..."]},"keyResults":[{"title":"...","targetValue":100,"unit":"..."}]}',
    ].join('\n');
  }
}

/**
 * NOTE: Convenience functions removed
 * These functions required a singleton getInstance() method which conflicts with DI pattern
 * Instead, inject the service through your DI container and call methods directly
 */
