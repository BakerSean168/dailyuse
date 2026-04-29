import { describe, expect, it, vi } from 'vitest';

import type { GenerateGoalAutomationRes } from '@dailyuse/contracts/ai';
import { AIGoalAutomationController } from './ai-goal-automation.controller';

describe('AIGoalAutomationController', () => {
  it('returns a validation failure for malformed requests', async () => {
    const service = {
      automateGoal: vi.fn(),
    };
    const controller = new AIGoalAutomationController(service);

    const result = await controller.automateGoal({ idea: 'short' }, 'identity-1');

    expect(result.ok).toBe(false);
    expect(service.automateGoal).not.toHaveBeenCalled();
    if (!result.ok) {
      expect(result.error.code).toBe('VALIDATION_ERROR');
    }
  });

  it('passes validated input to the automation service', async () => {
    const response: GenerateGoalAutomationRes = {
      summary: 'Create the goal and supporting milestones.',
      requiresConfirmation: true,
      plan: {
        goal: {
          title: 'Ship AI automation',
          description: 'Add explicit approvals.',
          category: 'work',
          importance: 'Important',
          tags: ['ai'],
          suggestedStartDate: 1,
          suggestedEndDate: 2,
        },
        keyResults: [],
        taskTemplates: [],
      },
      actions: [{ tool: 'create_goal', rationale: 'Create the goal first.' }],
      providerId: 'provider-1' as GenerateGoalAutomationRes['providerId'],
      tokenUsage: {
        promptTokens: 10,
        completionTokens: 10,
        totalTokens: 20,
      },
      processingTimeMs: 90,
    };
    const service = {
      automateGoal: vi.fn(async () => response),
    };
    const controller = new AIGoalAutomationController(service);

    const result = await controller.automateGoal(
      {
        idea: 'Plan and execute an AI goal workflow with explicit approvals.',
        includeKeyResults: true,
        includeTaskTemplates: true,
      },
      'identity-1',
    );

    expect(service.automateGoal).toHaveBeenCalledWith({
      identityId: 'identity-1',
      idea: 'Plan and execute an AI goal workflow with explicit approvals.',
      includeKeyResults: true,
      includeTaskTemplates: true,
      confirm: false,
    });
    expect(result).toEqual({
      ok: true,
      data: response,
    });
  });
});
