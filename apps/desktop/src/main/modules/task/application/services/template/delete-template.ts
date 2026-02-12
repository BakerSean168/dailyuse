/**
 * Delete Task Template Use Case
 */

import { DeleteTaskTemplate } from '@dailyuse/task/application-server';

export async function deleteTemplateUseCase(uuid: string): Promise<void> {
  await DeleteTaskTemplate.getInstance().execute(uuid);
}
