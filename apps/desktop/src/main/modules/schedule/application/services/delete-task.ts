import { DeleteScheduleTask } from '@dailyuse/schedule/application-server';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('deleteTaskService');

export async function deleteTaskService(uuid: string): Promise<void> {
  await DeleteScheduleTask.getInstance().execute(uuid);
}
