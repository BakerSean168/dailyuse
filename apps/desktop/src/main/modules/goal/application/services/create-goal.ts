/**
 * Create Goal Service
 */

import { CreateGoal } from '@dailyuse/application-server';
import type { CreateGoalRequest, GoalClientDTO } from '@dailyuse/contracts/goal';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('CreateGoalService');

export async function createGoalService(accountUuid: string, params: CreateGoalRequest): Promise<GoalClientDTO> {
  logger.debug('Creating goal', { title: params.title });
  const result = await CreateGoal.getInstance().execute(accountUuid, params);
  return result.goal;
}
