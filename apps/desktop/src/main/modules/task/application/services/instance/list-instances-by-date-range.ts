/**
 * List Instances By Date Range Use Case
 */

import { GetTaskInstancesByDateRange } from '@dailyuse/task/application-server';
import type { TaskInstanceClientDTO } from '@dailyuse/contracts/task';

export async function listInstancesByDateRangeUseCase(
  accountUuid: string,
  startDate: number,
  endDate: number
): Promise<{ instances: TaskInstanceClientDTO[]; total: number }> {
  const result = await GetTaskInstancesByDateRange.getInstance().execute(accountUuid, startDate, endDate);
  return {
    instances: result.instances as TaskInstanceClientDTO[],
    total: result.total,
  };
}
