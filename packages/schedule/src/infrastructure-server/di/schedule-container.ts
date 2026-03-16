import type { IScheduleRepository } from '../../domain-server/repositories/IScheduleRepository';
import type { IScheduleExecutionRepository } from '../../domain-server/repositories/IScheduleExecutionRepository';
import type { IScheduleTaskRepository } from '../../domain-server/repositories/IScheduleTaskRepository';

/**
 * @deprecated The schedule module no longer uses this container internally.
 *             Use {@link createScheduleModule} composition root instead.
 *             Kept only for backward compatibility with external callers
 *             (e.g. reminder module's `reminder-handler-support.ts`).
 * @deprecated 调度模块内部已不再使用该容器。
 *             请改用 {@link createScheduleModule} 组合根。
 *             当前仅为兼容外部调用方保留（如 reminder 模块的 `reminder-handler-support.ts`）。
 *
 * @see {@link createScheduleModule} from '../schedule.module'
 */
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
