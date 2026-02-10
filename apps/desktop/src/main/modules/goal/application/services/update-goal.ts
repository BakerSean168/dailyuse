/**
 * Update Goal Service
 */

import { UpdateGoal } from '@dailyuse/goal/application-server';
import type { UpdateGoalRequest, GoalClientDTO } from '@dailyuse/contracts/goal';

export async function updateGoalService(uuid: string, params: UpdateGoalRequest): Promise<GoalClientDTO> {
  const result = await UpdateGoal.getInstance().execute(uuid, params);
  return result.goal;
}
