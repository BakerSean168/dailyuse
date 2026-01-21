import { PrismaClient } from '@prisma/client';
import {
  PrismaTaskInstanceRepository,
  PrismaTaskTemplateRepository,
  PrismaTaskDependencyRepository,
  PrismaTaskStatisticsRepository
} from './repositories';
// Import Schedule Repo
import { PrismaScheduleTaskRepository } from '../schedule/repositories';

import {
  TaskInstanceApplicationService,
  TaskTemplateApplicationService,
  TaskDependencyApplicationService,
  TaskStatisticsApplicationService
} from '@dailyuse/application-server/task';

export class TaskModule {
  public readonly taskInstanceRepository: PrismaTaskInstanceRepository;
  public readonly taskTemplateRepository: PrismaTaskTemplateRepository;
  public readonly taskDependencyRepository: PrismaTaskDependencyRepository;
  public readonly taskStatisticsRepository: PrismaTaskStatisticsRepository;
  public readonly scheduleTaskRepository: PrismaScheduleTaskRepository;

  public readonly taskInstanceService: TaskInstanceApplicationService;
  public readonly taskTemplateService: TaskTemplateApplicationService;
  public readonly taskDependencyService: TaskDependencyApplicationService;
  public readonly taskStatisticsService: TaskStatisticsApplicationService;

  constructor(prisma: PrismaClient) {
    // 1. Initialize Repositories
    this.taskInstanceRepository = new PrismaTaskInstanceRepository(prisma);
    this.taskTemplateRepository = new PrismaTaskTemplateRepository(prisma);
    this.taskDependencyRepository = new PrismaTaskDependencyRepository(prisma);
    this.taskStatisticsRepository = new PrismaTaskStatisticsRepository(prisma);
    this.scheduleTaskRepository = new PrismaScheduleTaskRepository(prisma);

    // 2. Initialize Services (Pure DI)
    this.taskInstanceService = new TaskInstanceApplicationService(
      this.taskInstanceRepository,
      this.taskTemplateRepository
    );

    this.taskTemplateService = new TaskTemplateApplicationService(
      this.taskTemplateRepository,
      this.taskInstanceRepository,
      this.scheduleTaskRepository
    );
    
    this.taskDependencyService = new TaskDependencyApplicationService(
      this.taskDependencyRepository,
      this.taskTemplateRepository
    );

    this.taskStatisticsService = new TaskStatisticsApplicationService(
      this.taskStatisticsRepository,
      this.taskTemplateRepository,
      this.taskInstanceRepository
    );
  }
}
