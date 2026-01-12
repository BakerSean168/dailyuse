/**
 * Create One Time Task Use Case
 */

import { CreateTaskTemplate } from '@dailyuse/application-server';
import type { TaskTemplateClientDTO, CreateOneTimeTaskRequest } from '@dailyuse/contracts/task';
import { TaskType } from '@dailyuse/contracts/task';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('CreateOneTimeTaskUseCase');

export async function createOneTimeTaskUseCase(input: CreateOneTimeTaskRequest): Promise<TaskTemplateClientDTO> {
  logger.debug('Creating one-time task', { title: input.title });
  // Use CreateTaskTemplate with ONE_TIME task type
  const result = await CreateTaskTemplate.getInstance().execute({
    ...input,
    taskType: TaskType.ONE_TIME,
  } as any);
  return result.template as TaskTemplateClientDTO;
}
