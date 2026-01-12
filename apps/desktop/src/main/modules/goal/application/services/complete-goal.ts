/**
 * Complete Goal Service
 */

import { CompleteGoal } from '@dailyuse/application-server';
import type { GoalClientDTO } from '@dailyuse/contracts/goal';

export async function completeGoalService(uuid: string): Promise<GoalClientDTO> {
  const result = await CompleteGoal.getInstance().execute(uuid);
  return result.goal;
}
