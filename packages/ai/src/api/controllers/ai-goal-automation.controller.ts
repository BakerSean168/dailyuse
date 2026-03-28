import type { Result } from '@dailyuse/contracts/result';
import { fail, ok } from '@dailyuse/contracts/result';
import {
  GenerateGoalAutomationSchema,
  type GenerateGoalAutomationReq,
  type GenerateGoalAutomationRes,
} from '@dailyuse/contracts/ai';
import { formatZodErrors } from '@dailyuse/utils/result';

interface AIGoalAutomationControllerService {
  automateGoal(
    params: GenerateGoalAutomationReq & { identityId: string },
  ): Promise<GenerateGoalAutomationRes>;
}

export class AIGoalAutomationController {
  constructor(private readonly service: AIGoalAutomationControllerService) {}

  async automateGoal(input: unknown, identityId: string): Promise<Result<GenerateGoalAutomationRes>> {
    const parsed = GenerateGoalAutomationSchema.safeParse(input);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }

    return ok(
      await this.service.automateGoal({
        identityId,
        ...parsed.data,
      }),
    );
  }
}
