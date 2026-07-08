import { describe, expect, it, vi } from 'vitest';

import type { GenerateGoalsRes } from '@dailyuse/contracts/ai';
import { ok } from '@dailyuse/contracts/result';
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
      state: 'draft',
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
      generateGoal: vi.fn(async () => ok(response)),
    };
    const controller = new AIGoalGenerationController(service);

    const result = await controller.generateGoal(
      {
        idea: 'Build a unified AI goal workflow for the chat entry point.',
        includeKeyResults: true,
        clarificationAnswers: ['Target product teams', 'Within one quarter'],
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
      includeTaskTemplates: true,
      command: 'draft',
      clarificationAnswers: ['Target product teams', 'Within one quarter'],
      draftContext: undefined,
      approvedSummary: undefined,
      approvedPlan: undefined,
      approvedActions: undefined,
    });
    expect(result).toEqual({
      ok: true,
      data: response,
    });
  });

  it('forwards an explicit request id when provided by the route layer', async () => {
    const response: GenerateGoalsRes = {
      state: 'draft',
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
      generateGoal: vi.fn(async () => ok(response)),
    };
    const controller = new AIGoalGenerationController(service);

    await controller.generateGoal(
      {
        idea: 'Build a unified AI goal workflow for the chat entry point.',
      },
      'identity-1',
      'trace-goal-123',
    );

    expect(service.generateGoal).toHaveBeenCalledWith(
      expect.objectContaining({
        identityId: 'identity-1',
        requestId: 'trace-goal-123',
      }),
    );
  });

  it('returns clarification payloads without reshaping them', async () => {
    const response: GenerateGoalsRes = {
      state: 'clarification',
      clarification: {
        needsClarification: true,
        rationale: 'The request still needs scope and timing.',
        questions: [
          {
            question: 'What exact outcome do you want?',
            context: 'Needed to define the goal.',
          },
          {
            question: 'When do you want to achieve it?',
            context: 'Needed to set the timeframe.',
          },
        ],
      },
      tokenUsage: {
        promptTokens: 10,
        completionTokens: 5,
        totalTokens: 15,
      },
      providerId: 'provider-1' as GenerateGoalsRes['providerId'],
      processingTimeMs: 80,
      generatedAt: 234,
      providerUsed: 'OpenAI',
      modelUsed: 'gpt-4o-mini',
    };
    const service = {
      generateGoal: vi.fn(async () => ok(response)),
    };
    const controller = new AIGoalGenerationController(service);

    const result = await controller.generateGoal(
      {
        idea: 'Help me get better at AI engineering in a structured way.',
      },
      'identity-1',
    );

    expect(result).toEqual({
      ok: true,
      data: response,
    });
  });

  it('passes confirm-stage workflow fields through to the service', async () => {
    const response: GenerateGoalsRes = {
      state: 'confirm',
      summary: 'Drafted a practical execution plan.',
      plan: {
        goal: {
          title: 'Ship the AI goal workflow',
          description: 'Unify draft planning and execution.',
          category: 'work',
          importance: 'Important',
          tags: ['ai'],
          suggestedStartDate: 1,
          suggestedEndDate: 2,
        },
      },
      actions: [{ tool: 'create_goal', rationale: 'Create the goal first.' }],
      tokenUsage: {
        promptTokens: 10,
        completionTokens: 5,
        totalTokens: 15,
      },
      providerId: 'provider-1' as GenerateGoalsRes['providerId'],
      processingTimeMs: 50,
      generatedAt: 345,
      providerUsed: 'OpenAI',
      modelUsed: 'gpt-4o-mini',
    };
    const service = {
      generateGoal: vi.fn(async () => ok(response)),
    };
    const controller = new AIGoalGenerationController(service);

    await controller.generateGoal(
      {
        idea: 'Plan automation from an edited draft.',
        command: 'prepare',
        includeTaskTemplates: true,
        draftContext: {
          goal: {
            title: 'Ship the AI goal workflow',
            description: 'Unify draft planning and execution.',
            importance: 'Important',
          },
        },
      },
      'identity-1',
    );

    expect(service.generateGoal).toHaveBeenCalledWith(
      expect.objectContaining({
        identityId: 'identity-1',
        command: 'prepare',
        includeTaskTemplates: true,
        draftContext: expect.objectContaining({
          goal: expect.objectContaining({
            title: 'Ship the AI goal workflow',
          }),
        }),
      }),
    );
  });
});
