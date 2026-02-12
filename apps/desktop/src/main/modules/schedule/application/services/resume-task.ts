import { ResumeScheduleTask } from '@dailyuse/schedule/application-server';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('resumeTaskService');

export async function resumeTaskService(uuid: string): Promise<{ success: boolean }> {
  await ResumeScheduleTask.getInstance().execute(uuid);
  return { success: true };
}
