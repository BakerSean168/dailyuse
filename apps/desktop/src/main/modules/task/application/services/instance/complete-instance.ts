/**
 * Complete Task Instance Use Case
 */

import { CompleteTaskInstance } from '@dailyuse/task/application-server';
import type { TaskInstanceClientDTO } from '@dailyuse/contracts/task';

export async function completeInstanceUseCase(
  uuid: string,
  completion?: { duration?: number; note?: string; rating?: number }
): Promise<TaskInstanceClientDTO> {
  const result = await CompleteTaskInstance.getInstance().execute(uuid, completion ? {
    duration: completion.duration,
    note: completion.note,
    rating: completion.rating,
  } : undefined);
  return result.instance as TaskInstanceClientDTO;
}
