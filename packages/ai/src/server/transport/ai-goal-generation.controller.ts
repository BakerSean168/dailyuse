/**
 * AI Goal Generation Controller
 *
 * Validates input and delegates to GoalGenerationApplicationService.
 */

import type { Result } from '@memoflow/contracts/result';
import { fail } from '@memoflow/contracts/result';
import type { ExecutionContext } from '@memoflow/contracts/shared';
import { GenerateGoalsSchema } from '@memoflow/contracts/ai';
import type { GenerateGoalsReq, GenerateGoalsRes } from '@memoflow/contracts/ai';
import { formatZodErrors } from '@memoflow/utils/result';

interface AIGoalGenerationControllerService {
  generateGoal(params: GenerateGoalsReq, cx: ExecutionContext): Promise<Result<GenerateGoalsRes>>;
}

export class AIGoalGenerationController {
  constructor(private readonly service: AIGoalGenerationControllerService) {}

  async generateGoal(input: unknown, cx: ExecutionContext): Promise<Result<GenerateGoalsRes>> {
    const parsed = GenerateGoalsSchema.safeParse(input);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }

    return this.service.generateGoal(
      {
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
      },
      cx,
    );
  }
}
