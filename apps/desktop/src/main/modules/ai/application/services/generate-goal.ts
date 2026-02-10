import { GenerateGoal } from '@dailyuse/ai/application-server';
import type { GenerateGoalRequest, GenerateGoalResponse } from '@dailyuse/contracts/ai';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('generateGoalService');

export async function generateGoalService(
  accountUuid: string,
  input: GenerateGoalRequest,
): Promise<GenerateGoalResponse> {
  logger.debug('Generating goal', { accountUuid });
  return GenerateGoal.getInstance().execute(accountUuid, input);
}
