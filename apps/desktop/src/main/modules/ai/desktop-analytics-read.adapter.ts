import type { IAnalyticsReadPort } from '@dailyuse/ai/ports';
import { SearchGoalsUseCase } from '@dailyuse/goal/analytics';
import { getGoalRepository } from '@dailyuse/goal/electron-entry';
import { GetTaskDashboardUseCase } from '@dailyuse/task/analytics';
import { getTaskTemplateRepository } from '@dailyuse/task/electron-entry';

import { getDesktopDashboardData } from '../../services/dashboard-read-service';

export class DesktopAnalyticsReadAdapter implements IAnalyticsReadPort {
  async buildContext(identityId: string, question: string) {
    const goalRepository = getGoalRepository();
    const taskTemplateRepository = getTaskTemplateRepository();
    const dashboard = await getDesktopDashboardData(identityId);
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
