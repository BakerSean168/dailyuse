import type { IScheduleRepository } from '../../domain-server/repositories/IScheduleRepository';
import type { IScheduleExecutionRepository } from '../../domain-server/repositories/IScheduleExecutionRepository';
import type { IScheduleStatisticsRepository } from '../../domain-server/repositories/IScheduleStatisticsRepository';
import type { IScheduleTaskRepository } from '../../domain-server/repositories/IScheduleTaskRepository';

export class ScheduleContainer {
  private static instance: ScheduleContainer;
  private scheduleRepository?: IScheduleRepository;
  private scheduleExecutionRepository?: IScheduleExecutionRepository;
  private scheduleStatisticsRepository?: IScheduleStatisticsRepository;
  private scheduleTaskRepository?: IScheduleTaskRepository;

  private constructor() {}

  static getInstance(): ScheduleContainer {
    if (!ScheduleContainer.instance) {
      ScheduleContainer.instance = new ScheduleContainer();
    }
    return ScheduleContainer.instance;
  }

  setScheduleRepository(repository: IScheduleRepository): void {
    this.scheduleRepository = repository;
  }

  setScheduleExecutionRepository(repository: IScheduleExecutionRepository): void {
    this.scheduleExecutionRepository = repository;
  }

  setScheduleStatisticsRepository(repository: IScheduleStatisticsRepository): void {
    this.scheduleStatisticsRepository = repository;
  }

  setScheduleTaskRepository(repository: IScheduleTaskRepository): void {
    this.scheduleTaskRepository = repository;
  }

  getScheduleRepository(): IScheduleRepository {
    if (!this.scheduleRepository) {
      throw new Error('ScheduleRepository not registered in ScheduleContainer');
    }
    return this.scheduleRepository;
  }

  getScheduleExecutionRepository(): IScheduleExecutionRepository {
    if (!this.scheduleExecutionRepository) {
      throw new Error('ScheduleExecutionRepository not registered in ScheduleContainer');
    }
    return this.scheduleExecutionRepository;
  }

  getScheduleStatisticsRepository(): IScheduleStatisticsRepository {
    if (!this.scheduleStatisticsRepository) {
      throw new Error('ScheduleStatisticsRepository not registered in ScheduleContainer');
    }
    return this.scheduleStatisticsRepository;
  }

  getScheduleTaskRepository(): IScheduleTaskRepository {
    if (!this.scheduleTaskRepository) {
      throw new Error('ScheduleTaskRepository not registered in ScheduleContainer');
    }
    return this.scheduleTaskRepository;
  }

  reset(): void {
    this.scheduleRepository = undefined;
    this.scheduleExecutionRepository = undefined;
    this.scheduleStatisticsRepository = undefined;
    this.scheduleTaskRepository = undefined;
  }
}
