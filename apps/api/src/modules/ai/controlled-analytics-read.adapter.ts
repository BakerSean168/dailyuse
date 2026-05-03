import type { IAnalyticsReadPort } from '@dailyuse/ai/application-server';
import type { PrismaClient } from '@dailyuse/database';
import { SearchGoalsUseCase, GoalPrismaRepository } from '@dailyuse/goal';
import { GetTaskDashboardUseCase, TaskTemplatePrismaRepository } from '@dailyuse/task';

import { getApiDashboardData } from '../dashboard/dashboard-read-service';

export class ControlledAnalyticsReadAdapter implements IAnalyticsReadPort {
  constructor(private readonly db: PrismaClient) {}

  async buildContext(identityId: string, question: string) {
    const goalRepository = new GoalPrismaRepository(this.db);
    const taskTemplateRepository = new TaskTemplatePrismaRepository(this.db);
    const dashboard = await getApiDashboardData(this.db, identityId);
    const taskDashboard = await new GetTaskDashboardUseCase(taskTemplateRepository).execute(
      identityId,
    );
    const activeGoals = await goalRepository.findByIdentityId(identityId, {
      includeChildren: true,
      systemView: 'active',
    });
    const goalSearch = await new SearchGoalsUseCase(goalRepository).execute(
      identityId,
      question,
      'active',
    );

    return {
      dashboard: dashboard as unknown as Record<string, unknown>,
      taskDashboard: taskDashboard.ok
        ? (taskDashboard.data as unknown as Record<string, unknown>)
        : undefined,
      goals: activeGoals
        .slice(0, 10)
        .map((goal) => goal.toClientDTO(true) as unknown as Record<string, unknown>),
      goalSearchResults: goalSearch.ok
        ? goalSearch.data.data.map(
            (goal) => goal as unknown as Record<string, unknown>,
          )
        : [],
      extra: {},
    };
  }
}
