import type {
  IScheduleStatisticsRepository,
  IScheduleTaskRepository,
} from '@dailyuse/domain-server/schedule';
import { ScheduleStatisticsDomainService } from '@dailyuse/domain-server/schedule';
import type { ScheduleStatisticsClientDTO, SourceModule, ExecutionStatus } from '@dailyuse/contracts/schedule';

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

  async getStatistics(accountUuid: string): Promise<ScheduleStatisticsClientDTO | null> {
    const stats = await this.statisticsRepository.findByAccountUuid(accountUuid);
    return stats ? stats.toClientDTO() : null;
  }
  
  async recordSuccess(accountUuid: string, duration: number, sourceModule: SourceModule = 'task' as any): Promise<void> {
    const stats = await this.statisticsRepository.getOrCreate(accountUuid);
    stats.recordExecution('success' as ExecutionStatus, duration, sourceModule);
    stats.updateExecutionStats(duration);
    await this.statisticsRepository.save(stats);
  }

  async recordFailure(accountUuid: string, error: string, duration: number, sourceModule: SourceModule = 'task' as any): Promise<void> {
    const stats = await this.statisticsRepository.getOrCreate(accountUuid);
    stats.recordExecution('failed' as ExecutionStatus, duration, sourceModule);
    await this.statisticsRepository.save(stats);
  }
}

