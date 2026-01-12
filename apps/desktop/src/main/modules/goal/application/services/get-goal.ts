/**
 * Get Goal Service
 */

import { GetGoal } from '@dailyuse/application-server';
import type { GoalClientDTO } from '@dailyuse/contracts/goal';

export async function getGoalService(uuid: string, includeChildren = true): Promise<GoalClientDTO | null> {
  const result = await GetGoal.getInstance().execute(uuid, includeChildren);
  return result?.goal ?? null;
}
