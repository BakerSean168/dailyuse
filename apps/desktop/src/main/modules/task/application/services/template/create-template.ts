/**
 * Create Task Template Use Case
 */

import { CreateTaskTemplate } from '@dailyuse/application-server';
import type { TaskTemplateClientDTO, CreateTaskTemplateRequest } from '@dailyuse/contracts/task';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('CreateTemplateUseCase');

export async function createTemplateUseCase(input: CreateTaskTemplateRequest): Promise<TaskTemplateClientDTO> {
  logger.debug('Creating task template', { title: input.title });
  const result = await CreateTaskTemplate.getInstance().execute(input);
  return result.template;
}
