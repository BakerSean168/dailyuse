/**
 * Start Task Instance Use Case
 */

import { TaskContainer } from '@dailyuse/task/infrastructure-server';
import type { TaskInstanceClientDTO } from '@dailyuse/contracts/task';

export async function startInstanceUseCase(uuid: string): Promise<TaskInstanceClientDTO> {
  const container = TaskContainer.getInstance();
  const repo = container.getInstanceRepository();
  const instance = await repo.findByUuid(uuid);
  if (!instance) {
    throw new Error(`Task instance not found: ${uuid}`);
  }
  instance.start();
  await repo.save(instance);
  return instance.toClientDTO();
}
