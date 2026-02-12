/**
 * List Task Instances Use Case
 */

import { TaskContainer } from '@dailyuse/task/infrastructure-server';
import type { TaskInstanceClientDTO } from '@dailyuse/contracts/task';

export async function listInstancesUseCase(params: {
  templateUuid?: string;
  accountUuid: string;
}): Promise<{ instances: TaskInstanceClientDTO[]; total: number }> {
  const container = TaskContainer.getInstance();
  const repo = container.getInstanceRepository();
  
  let instances;
  if (params.templateUuid) {
    instances = await repo.findByTemplate(params.templateUuid);
  } else {
    instances = await repo.findByAccount(params.accountUuid);
  }
  
  return {
    instances: instances.map((i) => i.toClientDTO()),
    total: instances.length,
  };
}
