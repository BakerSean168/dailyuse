/**
 * Get Task Instance Use Case
 */

import { TaskContainer } from '@dailyuse/task/infrastructure-server';
import type { TaskInstanceClientDTO } from '@dailyuse/contracts/task';

export async function getInstanceUseCase(uuid: string): Promise<TaskInstanceClientDTO | null> {
  const container = TaskContainer.getInstance();
  const repo = container.getInstanceRepository();
  const instance = await repo.findByUuid(uuid);
  return instance?.toClientDTO() ?? null;
}
