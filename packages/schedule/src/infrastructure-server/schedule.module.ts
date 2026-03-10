import type { PrismaClient } from '@dailyuse/database';
import type {
  IScheduleExecutionRepository,
  IScheduleRepository,
  IScheduleTaskRepository,
} from '@/domain-server';

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
} from '@/application-server/use-cases';
import { ScheduleEventApplicationService } from '@/application-server/services/schedule-event-application-service';
import { ScheduleEventPublisher } from '@/application-server/use-cases/schedule-event-publisher';
import {
  ScheduleExecutionPrismaRepository,
  SchedulePrismaRepository,
  ScheduleTaskPrismaRepository,
} from '@/infrastructure-server/adapters/prisma';
import { ScheduleContainer } from '@/infrastructure-server/di/schedule-container';

export class ScheduleModule {
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

  constructor(dbConnection: PrismaClient) {
    // 1. Initialize Repositories
    const repositories = {
      scheduleRepository: new SchedulePrismaRepository(dbConnection),
      scheduleExecutionRepository: new ScheduleExecutionPrismaRepository(dbConnection),
      scheduleTaskRepository: new ScheduleTaskPrismaRepository(dbConnection),
    };
    const container = ScheduleContainer.getInstance();
    container.reset();
    container.setScheduleRepository(repositories.scheduleRepository);
    container.setScheduleExecutionRepository(repositories.scheduleExecutionRepository);
    container.setScheduleTaskRepository(repositories.scheduleTaskRepository);

    this.scheduleRepository = container.getScheduleRepository();
    this.scheduleExecutionRepository = container.getScheduleExecutionRepository();
    this.scheduleTaskRepository = container.getScheduleTaskRepository();

    // 2. Initialize Services
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
