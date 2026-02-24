import type { IScheduleRepository } from '../../domain-server/repositories/IScheduleRepository';
import type { IScheduleExecutionRepository } from '../../domain-server/repositories/IScheduleExecutionRepository';
import type { IScheduleTaskRepository } from '../../domain-server/repositories/IScheduleTaskRepository';

export class ScheduleContainer {
  private static instance: ScheduleContainer;
  private scheduleRepository?: IScheduleRepository;
  private scheduleExecutionRepository?: IScheduleExecutionRepository;
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

  getScheduleTaskRepository(): IScheduleTaskRepository {
    if (!this.scheduleTaskRepository) {
      throw new Error('ScheduleTaskRepository not registered in ScheduleContainer');
    }
    return this.scheduleTaskRepository;
  }

  reset(): void {
    this.scheduleRepository = undefined;
    this.scheduleExecutionRepository = undefined;
    this.scheduleTaskRepository = undefined;
  }
}
