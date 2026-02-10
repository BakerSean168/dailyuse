import { ScheduleContainer } from '@dailyuse/schedule/infrastructure-server';
import type { ScheduleTaskClientDTO } from '@dailyuse/contracts/schedule';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('updateTaskService');

export async function updateTaskService(
  uuid: string,
  updates: { description?: string; schedule?: { cronExpression?: string } },
): Promise<ScheduleTaskClientDTO> {
  const container = ScheduleContainer.getInstance();
  const repo = container.getScheduleTaskRepository();
  const task = await repo.findByUuid(uuid);
  if (!task) {
    throw new Error(`Schedule task not found: ${uuid}`);
  }

  if (updates.schedule?.cronExpression) {
    task.updateCronExpression(updates.schedule.cronExpression);
  }

  await repo.save(task);
  return task.toClientDTO();
}
