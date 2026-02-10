import { CreateScheduleTask } from '@dailyuse/schedule/application-server';
import type { ScheduleTaskClientDTO, CreateScheduleTaskRequest } from '@dailyuse/contracts/schedule';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('createTaskService');

export async function createTaskService(
  accountUuid: string,
  input: CreateScheduleTaskRequest,
): Promise<ScheduleTaskClientDTO> {
  logger.debug('Creating schedule task', { name: input.name, accountUuid });
  const result = await CreateScheduleTask.getInstance().execute(accountUuid, input);
  return result;
}
