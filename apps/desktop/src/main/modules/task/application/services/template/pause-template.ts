/**
 * Pause Task Template Use Case
 */

import { PauseTaskTemplate } from '@dailyuse/application-server';
import type { TaskTemplateClientDTO } from '@dailyuse/contracts/task';

export async function pauseTemplateUseCase(uuid: string): Promise<TaskTemplateClientDTO> {
  const result = await PauseTaskTemplate.getInstance().execute(uuid);
  return result.template;
}
