import { ListScheduleTasks } from '@dailyuse/application-server';
import type { ScheduleTaskClientDTO, ScheduleTaskQueryParamsDTO } from '@dailyuse/contracts/schedule';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('listTasksService');

export async function listTasksService(
  params?: ScheduleTaskQueryParamsDTO,
): Promise<{
  tasks: ScheduleTaskClientDTO[];
  total: number;
}> {
  const accountUuid = (params as any)?.accountUuid || 'default';
  const result = await ListScheduleTasks.getInstance().execute(accountUuid, params);
  return {
    tasks: result.tasks,
    total: result.total,
  };
}
