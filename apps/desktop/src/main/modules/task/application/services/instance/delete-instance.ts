/**
 * Delete Task Instance Use Case
 */

import { TaskContainer } from '@dailyuse/task/infrastructure-server';

export async function deleteInstanceUseCase(uuid: string): Promise<void> {
  const container = TaskContainer.getInstance();
  const repo = container.getInstanceRepository();
  await repo.delete(uuid);
}
