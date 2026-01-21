import type {
  IScheduleStatisticsRepository,
  IScheduleTaskRepository,
} from '@dailyuse/domain-server/schedule';
import { ScheduleStatisticsDomainService } from '@dailyuse/domain-server/schedule';
import type { ScheduleStatisticsClientDTO } from '@dailyuse/contracts/schedule';

/**
 * Schedule Statistics Application Service
 * Responsible for coordinating statistics domain logic.
 */
export class ScheduleStatisticsApplicationService {
  private domainService: ScheduleStatisticsDomainService;

  constructor(
    private statisticsRepository: IScheduleStatisticsRepository,
    private taskRepository: IScheduleTaskRepository,
  ) {
    this.domainService = new ScheduleStatisticsDomainService(statisticsRepository, taskRepository);
  }

  async getStatistics(uuid: string): Promise<ScheduleStatisticsClientDTO | null> {
      // Assuming UUID here refers to the schedule task UUID or stats UUID.
      // Usually statistics are per task or global.
      // Let's assume per task for now or ID lookup.
      const stats = await this.statisticsRepository.findByTaskUuid(uuid);
      return stats ? stats.toClientDTO() : null;
  }
  
  async recordSuccess(taskUuid: string, duration: number): Promise<void> {
      await this.domainService.recordExecutionSuccess(taskUuid, duration);
  }

  async recordFailure(taskUuid: string, error: string, duration: number): Promise<void> {
      await this.domainService.recordExecutionFailure(taskUuid, error, duration);
  }
}

