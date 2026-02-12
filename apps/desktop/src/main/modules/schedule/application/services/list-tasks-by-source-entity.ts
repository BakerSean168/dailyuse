import { ListScheduleTasks } from '@dailyuse/schedule/application-server';
import type { ScheduleTaskClientDTO, SourceModule } from '@dailyuse/contracts/schedule';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('listTasksBySourceEntityService');

export async function listTasksBySourceEntityService(
  sourceModule: string,
  sourceEntityId: string,
): Promise<{ tasks: ScheduleTaskClientDTO[]; total: number }> {
  const result = await ListScheduleTasks.getInstance().execute('default', {
    sourceModule: sourceModule as SourceModule,
    sourceEntityId,
  });
  return {
    tasks: result.tasks,
    total: result.total,
  };
}
