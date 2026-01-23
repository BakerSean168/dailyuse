import type {  PrismaClient  } from "@prisma/client";
import {
  TaskInstancePrismaRepository,
  TaskTemplatePrismaRepository,
  TaskDependencyPrismaRepository,
  TaskStatisticsPrismaRepository
} from './adapters/prisma';
// Import Schedule Repo
import { ScheduleTaskPrismaRepository } from '../schedule/adapters/prisma';

import {
  TaskInstanceApplicationService,
  TaskTemplateApplicationService,
  TaskDependencyApplicationService,
  TaskStatisticsApplicationService
} from '@dailyuse/application-server/task';

export class TaskModule {
  public readonly taskInstanceRepository: TaskInstancePrismaRepository;
  public readonly taskTemplateRepository: TaskTemplatePrismaRepository;
  public readonly taskDependencyRepository: TaskDependencyPrismaRepository;
  public readonly taskStatisticsRepository: TaskStatisticsPrismaRepository;
  public readonly scheduleTaskRepository: ScheduleTaskPrismaRepository;

  public readonly taskInstanceService: TaskInstanceApplicationService;
  public readonly taskTemplateService: TaskTemplateApplicationService;
  public readonly taskDependencyService: TaskDependencyApplicationService;
  public readonly taskStatisticsService: TaskStatisticsApplicationService;

  constructor(prisma: PrismaClient) {
    // 1. Initialize Repositories
    this.taskInstanceRepository = new TaskInstancePrismaRepository(prisma);
    this.taskTemplateRepository = new TaskTemplatePrismaRepository(prisma);
    this.taskDependencyRepository = new TaskDependencyPrismaRepository(prisma);
    this.taskStatisticsRepository = new TaskStatisticsPrismaRepository(prisma);
    this.scheduleTaskRepository = new ScheduleTaskPrismaRepository(prisma);

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
