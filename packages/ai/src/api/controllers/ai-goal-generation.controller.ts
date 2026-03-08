/**
 * AI Goal Generation Controller
 *
 * Validates input and delegates to GoalGenerationApplicationService.
 */

import type { Result } from '@dailyuse/contracts/result';
import { fail, ok } from '@dailyuse/contracts/result';
import { GenerateGoalsSchema } from '@dailyuse/contracts/ai';
import type { GenerateGoalsRes } from '@dailyuse/contracts/ai';
import { formatZodErrors } from '@dailyuse/utils/result';
import type { GoalGenerationApplicationService } from '../../application-server/use-cases/commands/goal-generation-application-service';

export class AIGoalGenerationController {
  constructor(private readonly service: GoalGenerationApplicationService) {}

  async generateGoal(input: unknown, identityId: string): Promise<Result<GenerateGoalsRes>> {
    const parsed = GenerateGoalsSchema.safeParse(input);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }

    const result = await this.service.generateGoal({
      identityId,
      idea: parsed.data.idea,
      providerId: parsed.data.providerId,
      category: parsed.data.category as any,
      timeframe: parsed.data.timeframe,
      includeKeyResults: parsed.data.includeKeyResults,
    });

    return ok(result as GenerateGoalsRes);
  }
}
