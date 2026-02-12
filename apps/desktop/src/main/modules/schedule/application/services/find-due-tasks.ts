import { FindDueTasks } from '@dailyuse/schedule/application-server';
import type { ScheduleTaskClientDTO } from '@dailyuse/contracts/schedule';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('findDueTasksService');

export async function findDueTasksService(params?: {
  beforeTime?: Date;
}): Promise<{
  tasks: ScheduleTaskClientDTO[];
  total: number;
}> {
  const beforeTime = params?.beforeTime || new Date();
  const result = await FindDueTasks.getInstance().execute(beforeTime);
  return {
    tasks: result.tasks,
    total: result.total,
  };
}
