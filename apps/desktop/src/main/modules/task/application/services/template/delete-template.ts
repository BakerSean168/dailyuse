/**
 * Delete Task Template Use Case
 */

import { DeleteTaskTemplate } from '@dailyuse/application-server';

export async function deleteTemplateUseCase(uuid: string): Promise<void> {
  await DeleteTaskTemplate.getInstance().execute(uuid);
}
