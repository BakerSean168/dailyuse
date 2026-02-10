/**
 * List Instances By Template Use Case
 */

import { TaskContainer } from '@dailyuse/task/infrastructure-server';
import type { TaskInstanceClientDTO } from '@dailyuse/contracts/task';

export async function listInstancesByTemplateUseCase(
  templateUuid: string
): Promise<{ instances: TaskInstanceClientDTO[]; total: number }> {
  const container = TaskContainer.getInstance();
  const repo = container.getInstanceRepository();
  const instances = await repo.findByTemplate(templateUuid);
  return {
    instances: instances.map((i) => i.toClientDTO()),
    total: instances.length,
  };
}
