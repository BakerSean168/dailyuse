import type { IScheduleStatisticsRepository } from '../../domain-server/repositories/IScheduleStatisticsRepository';
import type { IScheduleTaskRepository } from '../../domain-server/repositories/IScheduleTaskRepository';

/**
 * ScheduleStatisticsApplicationService (stub).
 * TODO: Implement schedule statistics aggregation logic.
 */
export class ScheduleStatisticsApplicationService {
  constructor(
    private readonly scheduleStatisticsRepository: IScheduleStatisticsRepository,
    private readonly scheduleTaskRepository: IScheduleTaskRepository,
  ) {}
}
