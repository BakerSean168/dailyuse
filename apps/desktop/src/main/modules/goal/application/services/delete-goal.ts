/**
 * Delete Goal Service
 */

import { DeleteGoal } from '@dailyuse/application-server';

export async function deleteGoalService(uuid: string): Promise<void> {
  await DeleteGoal.getInstance().execute(uuid);
}
