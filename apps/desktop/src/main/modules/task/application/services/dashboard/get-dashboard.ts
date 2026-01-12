/**
 * Get Task Dashboard Use Case
 */

import { GetTaskDashboard } from '@dailyuse/application-server';
import type { TaskDashboardResponse } from '@dailyuse/contracts/task';

export async function getDashboardUseCase(accountUuid: string): Promise<TaskDashboardResponse> {
  return GetTaskDashboard.getInstance().execute(accountUuid);
}
