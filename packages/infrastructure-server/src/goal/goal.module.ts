import type { PrismaClient } from '@prisma/client';
import {
  ArchiveGoal,
  GoalApplicationService,
  GoalKeyResultApplicationService,
  SearchGoals
} from '@dailyuse/application-server';
import { GoalPrismaRepository } from './adapters/prisma/goal-prisma.repository';

export class GoalModule {
  public readonly archiveGoal: ArchiveGoal;
  public readonly goalApplicationService: GoalApplicationService;
  public readonly goalKeyResultApplicationService: GoalKeyResultApplicationService;
  public readonly searchGoalsService: SearchGoals;

  public readonly goalRepository: GoalPrismaRepository;

  constructor(prisma: PrismaClient) {
    // 1. Instantiate Repositories
    this.goalRepository = new GoalPrismaRepository(prisma);

    // 2. Instantiate Services (Wiring)
    this.archiveGoal = new ArchiveGoal(this.goalRepository);
    this.goalApplicationService = new GoalApplicationService(this.goalRepository);
    this.goalKeyResultApplicationService = new GoalKeyResultApplicationService(this.goalRepository);
    this.searchGoalsService = new SearchGoals(this.goalRepository);
  }
}
