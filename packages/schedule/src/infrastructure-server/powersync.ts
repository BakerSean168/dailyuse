import type {
  IScheduleExecutionRepository,
  IScheduleRepository,
  IScheduleTaskRepository,
} from '../domain-server';
import {
  CreateScheduleTaskUseCase,
  DeleteScheduleTaskUseCase,
  ListScheduleTasksBySourceUseCase,
  PauseScheduleTaskUseCase,
  ResumeScheduleTaskUseCase,
  GetScheduleTaskUseCase,
  ListScheduleTasksByAccountUseCase,
  ListScheduleTasksByStatusUseCase,
  TriggerScheduleTaskUseCase,
  UpdateScheduleTaskUseCase,
} from '../application-server/use-cases';
import { ScheduleEventApplicationService } from '../application-server/services/schedule-event-application-service';
import { ScheduleEventPublisher } from '../application-server/use-cases/schedule-event-publisher';
import { ScheduleContainer } from './di/schedule-container';
import { PowerSyncScheduleRepository } from './adapters/powersync/schedule-powersync.repository';
import { PowerSyncScheduleExecutionRepository } from './adapters/powersync/schedule-execution-powersync.repository';
import { PowerSyncScheduleTaskRepository } from './adapters/powersync/schedule-task-powersync.repository';

type Queryable = {
  getAll<T>(sql: string, parameters?: unknown[]): Promise<T[]>;
  getOptional<T>(sql: string, parameters?: unknown[]): Promise<T | null>;
  get<T>(sql: string, parameters?: unknown[]): Promise<T>;
  execute(sql: string, parameters?: unknown[]): Promise<unknown>;
};

export class SchedulePowerSyncModule {
  public readonly scheduleRepository: IScheduleRepository;
  public readonly scheduleExecutionRepository: IScheduleExecutionRepository;
  public readonly scheduleTaskRepository: IScheduleTaskRepository;
  public readonly createScheduleTask: CreateScheduleTaskUseCase;
  public readonly updateScheduleTask: UpdateScheduleTaskUseCase;
  public readonly deleteScheduleTask: DeleteScheduleTaskUseCase;
  public readonly pauseScheduleTask: PauseScheduleTaskUseCase;
  public readonly resumeScheduleTask: ResumeScheduleTaskUseCase;
  public readonly triggerScheduleTask: TriggerScheduleTaskUseCase;
  public readonly getScheduleTask: GetScheduleTaskUseCase;
  public readonly listScheduleTasksByAccount: ListScheduleTasksByAccountUseCase;
  public readonly listScheduleTasksBySource: ListScheduleTasksBySourceUseCase;
  public readonly listScheduleTasksByStatus: ListScheduleTasksByStatusUseCase;
  public readonly scheduleEventService: ScheduleEventApplicationService;

  constructor(dbConnection: Queryable) {
    const scheduleRepository = new PowerSyncScheduleRepository(dbConnection);
    const scheduleExecutionRepository = new PowerSyncScheduleExecutionRepository(dbConnection);
    const scheduleTaskRepository = new PowerSyncScheduleTaskRepository(dbConnection);

    const container = ScheduleContainer.getInstance();
    container.reset();
    container.setScheduleRepository(scheduleRepository);
    container.setScheduleExecutionRepository(scheduleExecutionRepository);
    container.setScheduleTaskRepository(scheduleTaskRepository);

    this.scheduleRepository = container.getScheduleRepository();
    this.scheduleExecutionRepository = container.getScheduleExecutionRepository();
    this.scheduleTaskRepository = container.getScheduleTaskRepository();

    this.createScheduleTask = new CreateScheduleTaskUseCase(this.scheduleTaskRepository);
    this.updateScheduleTask = new UpdateScheduleTaskUseCase(this.scheduleTaskRepository);
    this.deleteScheduleTask = new DeleteScheduleTaskUseCase(this.scheduleTaskRepository);
    this.pauseScheduleTask = new PauseScheduleTaskUseCase(this.scheduleTaskRepository);
    this.resumeScheduleTask = new ResumeScheduleTaskUseCase(this.scheduleTaskRepository);
    this.triggerScheduleTask = new TriggerScheduleTaskUseCase(this.scheduleTaskRepository);
    this.getScheduleTask = new GetScheduleTaskUseCase(this.scheduleTaskRepository);
    this.listScheduleTasksByAccount = new ListScheduleTasksByAccountUseCase(
      this.scheduleTaskRepository,
    );
    this.listScheduleTasksBySource = new ListScheduleTasksBySourceUseCase(
      this.scheduleTaskRepository,
    );
    this.listScheduleTasksByStatus = new ListScheduleTasksByStatusUseCase(
      this.scheduleTaskRepository,
    );
    this.scheduleEventService = new ScheduleEventApplicationService(this.scheduleRepository);

    ScheduleEventPublisher.configure({
      createScheduleTask: this.createScheduleTask,
      listScheduleTasksBySource: this.listScheduleTasksBySource,
      deleteScheduleTask: this.deleteScheduleTask,
      pauseScheduleTask: this.pauseScheduleTask,
      resumeScheduleTask: this.resumeScheduleTask,
    });
  }
}

export {
  PowerSyncScheduleRepository,
  PowerSyncScheduleExecutionRepository,
  PowerSyncScheduleTaskRepository,
  ScheduleContainer,
};
