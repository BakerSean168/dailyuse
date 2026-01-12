import { GetScheduleTask } from '@dailyuse/application-server';
import type { ScheduleTaskClientDTO } from '@dailyuse/contracts/schedule';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('getTaskService');

export async function getTaskService(uuid: string): Promise<ScheduleTaskClientDTO | null> {
  const result = await GetScheduleTask.getInstance().execute(uuid);
  return result;
}
