/**
 * Get Task Template Use Case
 */

import { GetTaskTemplate } from '@dailyuse/task/application-server';
import type { TaskTemplateClientDTO } from '@dailyuse/contracts/task';

export async function getTemplateUseCase(uuid: string): Promise<TaskTemplateClientDTO | null> {
  const result = await GetTaskTemplate.getInstance().execute(uuid);
  return result.template as TaskTemplateClientDTO | null;
}
