import { ListScheduleTasks } from '@dailyuse/schedule/application-server';
import type { ScheduleTaskStatus } from '@dailyuse/contracts/schedule';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('getStatisticsSummaryService');

export async function getStatisticsSummaryService(accountUuid?: string): Promise<{
  total: number;
  active: number;
  completed: number;
  overdue: number;
}> {
  const result = await ListScheduleTasks.getInstance().execute(accountUuid || 'default');

  const activeStatus: ScheduleTaskStatus = 'active' as ScheduleTaskStatus;
  const completedStatus: ScheduleTaskStatus = 'completed' as ScheduleTaskStatus;

  return {
    total: result.total,
    active: result.tasks.filter((t) => t.status === activeStatus).length,
    completed: result.tasks.filter((t) => t.status === completedStatus).length,
    overdue: result.tasks.filter((t) => t.isOverdue).length,
  };
}
