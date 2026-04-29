import { describe, expect, it, vi } from 'vitest';

import type { GenerateGoalsRes } from '@dailyuse/contracts/ai';
import { AIGoalGenerationController } from './ai-goal-generation.controller';

describe('AIGoalGenerationController', () => {
  it('returns a validation failure for malformed requests', async () => {
    const service = {
      generateGoal: vi.fn(),
    };
    const controller = new AIGoalGenerationController(service);

    const result = await controller.generateGoal({ idea: 'short' }, 'identity-1');

    expect(result.ok).toBe(false);
    expect(service.generateGoal).not.toHaveBeenCalled();
    if (!result.ok) {
      expect(result.error.code).toBe('VALIDATION_ERROR');
    }
  });

  it('passes validated input to the service and returns the generated goal', async () => {
    const response: GenerateGoalsRes = {
      goal: {
        title: 'Ship the AI goal workflow',
        description: 'Unify draft planning and execution.',
        category: 'work',
        importance: 'Important',
        tags: ['ai'],
        suggestedStartDate: 1,
        suggestedEndDate: 2,
      },
      keyResults: [],
      tokenUsage: {
        promptTokens: 12,
        completionTokens: 8,
        totalTokens: 20,
      },
      providerId: 'provider-1' as GenerateGoalsRes['providerId'],
      processingTimeMs: 120,
      generatedAt: 123,
      providerUsed: 'OpenAI',
      modelUsed: 'gpt-4o-mini',
    };
    const service = {
      generateGoal: vi.fn(async () => response),
    };
    const controller = new AIGoalGenerationController(service);

    const result = await controller.generateGoal(
      {
        idea: 'Build a unified AI goal workflow for the chat entry point.',
        includeKeyResults: true,
      },
      'identity-1',
    );

    expect(service.generateGoal).toHaveBeenCalledWith({
      identityId: 'identity-1',
      idea: 'Build a unified AI goal workflow for the chat entry point.',
      providerId: undefined,
      model: undefined,
      category: undefined,
      timeframe: undefined,
      includeKeyResults: true,
    });
    expect(result).toEqual({
      ok: true,
      data: response,
    });
  });
});
