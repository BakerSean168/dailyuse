import { PauseScheduleTask } from '@dailyuse/schedule/application-server';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('pauseTaskService');

export async function pauseTaskService(uuid: string): Promise<{ success: boolean }> {
  await PauseScheduleTask.getInstance().execute(uuid);
  return { success: true };
}
