/**
 * Activate Goal Service
 */

import { ActivateGoal } from '@dailyuse/application-server';
import type { GoalClientDTO } from '@dailyuse/contracts/goal';

export async function activateGoalService(uuid: string): Promise<GoalClientDTO> {
  const result = await ActivateGoal.getInstance().execute(uuid);
  return result.goal;
}
