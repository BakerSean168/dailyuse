import { ListScheduleTasks } from '@dailyuse/schedule/application-server';
import type { ScheduleTaskStatus } from '@dailyuse/contracts/schedule';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('getStatisticsByDateRangeService');

export async function getStatisticsByDateRangeService(
  startDate: number,
  endDate: number,
  accountUuid?: string,
): Promise<{ data: Array<{ date: number; active: number; completed: number }> }> {
  const result = await ListScheduleTasks.getInstance().execute(accountUuid || 'default');

  const startMs = startDate;
  const endMs = endDate;
  const filteredTasks = result.tasks.filter((task) => {
    const nextRunAtStr = task.execution?.nextRunAt;
    if (!nextRunAtStr) return false;
    const nextRunAt = new Date(nextRunAtStr).getTime();
    return nextRunAt >= startMs && nextRunAt <= endMs;
  });

  const dateMap = new Map<number, { active: number; completed: number }>();
  for (const task of filteredTasks) {
    const nextRunAtStr = task.execution?.nextRunAt;
    if (!nextRunAtStr) continue;
    const nextRunAt = new Date(nextRunAtStr).getTime();
    const dateKey = new Date(nextRunAt).setHours(0, 0, 0, 0);
    if (!dateMap.has(dateKey)) {
      dateMap.set(dateKey, { active: 0, completed: 0 });
    }
    const stats = dateMap.get(dateKey)!;
    stats.active++;
    if (task.status === ('completed' as ScheduleTaskStatus)) {
      stats.completed++;
    }
  }

  const data = Array.from(dateMap.entries()).map(([date, stats]) => ({
    date,
    active: stats.active,
    completed: stats.completed,
  }));

  return { data };
}
