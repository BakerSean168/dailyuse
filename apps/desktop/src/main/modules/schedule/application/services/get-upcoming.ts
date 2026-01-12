import { ListScheduleTasks } from '@dailyuse/application-server';
import type { ScheduleTaskClientDTO, ScheduleTaskStatus } from '@dailyuse/contracts/schedule';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('getUpcomingService');

export async function getUpcomingService(
  days: number = 7,
  accountUuid?: string,
): Promise<{
  tasks: ScheduleTaskClientDTO[];
  total: number;
}> {
  const result = await ListScheduleTasks.getInstance().execute(accountUuid || 'default');
  const now = Date.now();
  const endDate = now + days * 24 * 60 * 60 * 1000;

  const upcomingTasks = result.tasks.filter((task) => {
    const nextRunAtStr = task.execution?.nextRunAt;
    if (!nextRunAtStr) return false;
    const nextRunAt = new Date(nextRunAtStr).getTime();
    return (
      nextRunAt >= now &&
      nextRunAt <= endDate &&
      task.status === ('active' as ScheduleTaskStatus)
    );
  });

  return {
    tasks: upcomingTasks,
    total: upcomingTasks.length,
  };
}
