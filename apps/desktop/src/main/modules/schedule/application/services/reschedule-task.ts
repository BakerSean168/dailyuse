import { ScheduleContainer } from '@dailyuse/schedule/infrastructure-server';
import type { ScheduleTaskClientDTO } from '@dailyuse/contracts/schedule';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('rescheduleTaskService');

export async function rescheduleTaskService(
  uuid: string,
  newSchedule: { cronExpression?: string },
): Promise<ScheduleTaskClientDTO> {
  const container = ScheduleContainer.getInstance();
  const repo = container.getScheduleTaskRepository();
  const task = await repo.findByUuid(uuid);
  if (!task) {
    throw new Error(`Schedule task not found: ${uuid}`);
  }
  if (newSchedule.cronExpression) {
    task.updateCronExpression(newSchedule.cronExpression);
  }
  await repo.save(task);
  return task.toClientDTO();
}
