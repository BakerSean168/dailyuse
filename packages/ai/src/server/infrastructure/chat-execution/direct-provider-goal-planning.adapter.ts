import type {
  GoalPlanningInput,
  GoalPlanningResult,
  IGoalPlanningPort,
} from '../../application/ports';
import type { IModelGatewayPort } from '@dailyuse/contracts/ai';
import { CustomModelGateway } from '../model-gateway';
import {
  buildGoalGenerationSystemPrompt,
  buildGoalGenerationUserPrompt,
  parseGoalPlanningResponse,
} from './goal-planning-response';

/**
 * Residual 337: goal planning completions go through CustomModelGateway.
 */
export class DirectProviderGoalPlanningAdapter implements IGoalPlanningPort {
  constructor(private readonly modelGateway: IModelGatewayPort = new CustomModelGateway()) {}

  async plan(input: GoalPlanningInput): Promise<GoalPlanningResult> {
    const completion = await this.modelGateway.complete({
      auth: {
        bindingId: `${input.providerConfig.provider}:${input.providerConfig.model}`,
        baseUrl: input.providerConfig.baseUrl ?? 'https://api.openai.com/v1',
        apiKey: input.providerConfig.apiKey,
      },
      model: input.providerConfig.model,
      temperature: input.providerConfig.temperature ?? 0.3,
      maxTokens: input.providerConfig.maxTokens,
      responseFormat: 'json',
      messages: [
        {
          role: 'system',
          content: buildGoalGenerationSystemPrompt(),
        },
        {
          role: 'user',
          content: buildGoalGenerationUserPrompt({
            idea: input.idea,
            category: input.category,
            timeframe: input.timeframe,
            includeKeyResults: input.includeKeyResults,
          }),
        },
      ],
    });

    const parsed = parseGoalPlanningResponse(
      completion.content,
      Date.now(),
      input.includeKeyResults,
    );

    return {
      state: 'draft',
      goal: parsed.goal,
      keyResults: parsed.keyResults,
      usage: completion.usage,
    };
  }
}
