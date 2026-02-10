/**
 * Archive Goal Service
 */

import { ArchiveGoal } from '@dailyuse/goal/application-server';
import type { GoalClientDTO } from '@dailyuse/contracts/goal';

export async function archiveGoalService(uuid: string): Promise<GoalClientDTO> {
  const result = await ArchiveGoal.getInstance().execute(uuid);
  return result.goal;
}
