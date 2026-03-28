import type { IAnalyticsReadPort } from '@dailyuse/ai/application-server';
import { SearchGoals } from '@dailyuse/goal';
import { getGoalRepository } from '@dailyuse/goal/electron-entry';
import { GetTaskDashboard } from '@dailyuse/task';
import { getTaskTemplateRepository } from '@dailyuse/task/electron-entry';

import { getDesktopDashboardData } from '../../services/dashboard-read-service';

export class DesktopAnalyticsReadAdapter implements IAnalyticsReadPort {
  async buildContext(identityId: string, question: string) {
    const goalRepository = getGoalRepository();
    const taskTemplateRepository = getTaskTemplateRepository();
    const dashboard = await getDesktopDashboardData(identityId);
    const taskDashboard = await new GetTaskDashboard(taskTemplateRepository).execute(
      identityId,
    );
    const activeGoals = await goalRepository.findByIdentityId(identityId, {
      includeChildren: true,
      systemView: 'active',
    });
    const goalSearch = await new SearchGoals(goalRepository).execute(
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
