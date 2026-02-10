/**
 * Archive Task Template Use Case
 */

import { TaskContainer } from '@dailyuse/task/infrastructure-server';
import type { TaskTemplateClientDTO } from '@dailyuse/contracts/task';

export async function archiveTemplateUseCase(uuid: string): Promise<TaskTemplateClientDTO> {
  const container = TaskContainer.getInstance();
  const repo = container.getTemplateRepository();
  const template = await repo.findByUuid(uuid);
  if (!template) {
    throw new Error(`Task template not found: ${uuid}`);
  }
  template.archive();
  await repo.save(template);
  return template.toClientDTO();
}
