/**
 * Skip Task Instance Use Case
 */

import { SkipTaskInstance } from '@dailyuse/task/application-server';
import type { TaskInstanceClientDTO } from '@dailyuse/contracts/task';

export async function skipInstanceUseCase(uuid: string, reason?: string): Promise<TaskInstanceClientDTO> {
  const result = await SkipTaskInstance.getInstance().execute(uuid, reason ? { reason } : undefined);
  return result.instance as TaskInstanceClientDTO;
}
