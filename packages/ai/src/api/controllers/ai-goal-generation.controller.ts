/**
 * AI Goal Generation Controller
 *
 * Validates input and delegates to GoalGenerationApplicationService.
 */

import type { Result } from '@dailyuse/contracts/result';
import { fail, ok } from '@dailyuse/contracts/result';
import { GenerateGoalsSchema } from '@dailyuse/contracts/ai';
import type { GenerateGoalsReq, GenerateGoalsRes } from '@dailyuse/contracts/ai';
import { formatZodErrors } from '@dailyuse/utils/result';
import { toAIControllerFailure } from './ai-controller-errors';

interface AIGoalGenerationControllerService {
  generateGoal(params: GenerateGoalsReq & { identityId: string }): Promise<GenerateGoalsRes>;
}

export class AIGoalGenerationController {
  constructor(private readonly service: AIGoalGenerationControllerService) {}

  async generateGoal(input: unknown, identityId: string): Promise<Result<GenerateGoalsRes>> {
    const parsed = GenerateGoalsSchema.safeParse(input);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }

    try {
      return ok(
        await this.service.generateGoal({
          identityId,
          idea: parsed.data.idea,
          providerId: parsed.data.providerId,
          model: parsed.data.model,
          category: parsed.data.category,
          timeframe: parsed.data.timeframe,
          includeKeyResults: parsed.data.includeKeyResults,
          includeTaskTemplates: parsed.data.includeTaskTemplates,
          command: parsed.data.command,
          clarificationAnswers: parsed.data.clarificationAnswers,
          draftContext: parsed.data.draftContext,
          approvedSummary: parsed.data.approvedSummary,
          approvedPlan: parsed.data.approvedPlan,
          approvedActions: parsed.data.approvedActions,
        }),
      );
    } catch (error) {
      return toAIControllerFailure(error, 'Goal generation failed');
    }
  }
}
