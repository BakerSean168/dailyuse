/**
 * Activate Task Template Use Case
 */

import { ActivateTaskTemplate } from '@dailyuse/task/application-server';
import type { TaskTemplateClientDTO } from '@dailyuse/contracts/task';

export async function activateTemplateUseCase(uuid: string): Promise<TaskTemplateClientDTO> {
  const result = await ActivateTaskTemplate.getInstance().execute(uuid);
  return result.template;
}
