import type {
  GoalPlanningInput,
  GoalPlanningResult,
  IGoalPlanningPort,
} from '../../application/ports';
import { OpenAICompatibleGateway } from '../gateways/openai-compatible.gateway';
import {
  buildGoalGenerationSystemPrompt,
  buildGoalGenerationUserPrompt,
  parseGoalPlanningResponse,
} from './goal-planning-response';

export class DirectProviderGoalPlanningAdapter implements IGoalPlanningPort {
  constructor(private readonly gateway: OpenAICompatibleGateway = new OpenAICompatibleGateway()) {}

  async plan(input: GoalPlanningInput): Promise<GoalPlanningResult> {
    const completion = await this.gateway.complete({
      baseUrl: input.providerConfig.baseUrl ?? 'https://api.openai.com/v1',
      apiKey: input.providerConfig.apiKey,
      model: input.providerConfig.model,
      temperature: input.providerConfig.temperature ?? 0.3,
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
