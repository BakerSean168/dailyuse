import type { IAnalyticsReadPort } from '@dailyuse/ai/ports';
import type { PrismaClient } from '@dailyuse/database';
import { SearchGoalsUseCase } from '@dailyuse/goal/analytics';
import { createGoalPrismaModule } from '@dailyuse/goal';
import { GetTaskDashboardUseCase } from '@dailyuse/task/analytics';
import { createTaskPrismaRepositories } from '@dailyuse/task';

import { getApiDashboardData } from '../dashboard/dashboard-read-service';

export class ControlledAnalyticsReadAdapter implements IAnalyticsReadPort {
  constructor(private readonly db: PrismaClient) {}

  async buildContext(identityId: string, question: string) {
    const goalModule = createGoalPrismaModule(this.db);
    const taskRepos = createTaskPrismaRepositories(this.db);
    const dashboard = await getApiDashboardData(this.db, identityId);
    const taskDashboard = await new GetTaskDashboardUseCase(taskRepos.taskTemplateRepository).execute(
      identityId,
    );
    const activeGoals = await goalModule.goalRepository.findByIdentityId(identityId, {
      includeChildren: true,
      systemView: 'active',
    });
    const goalSearch = await new SearchGoalsUseCase(goalModule.goalRepository).execute(
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
