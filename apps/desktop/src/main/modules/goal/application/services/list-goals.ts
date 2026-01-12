/**
 * List Goals Service
 */

import { ListGoals } from '@dailyuse/application-server';
import type { QueryGoalsRequest, GoalClientDTO, GoalStatus } from '@dailyuse/contracts/goal';

export async function listGoalsService(params: {
  accountUuid?: string;
  status?: GoalStatus | GoalStatus[];
  folderUuid?: string;
  includeChildren?: boolean;
}): Promise<{ goals: GoalClientDTO[]; total: number }> {
  const input: QueryGoalsRequest = {
    accountUuid: params.accountUuid || 'default',
    status: params.status ? (Array.isArray(params.status) ? params.status : [params.status]) : undefined,
    folderUuid: params.folderUuid,
    includeKeyResults: params.includeChildren,
  };

  const result = await ListGoals.getInstance().execute(input);
  return { goals: result.goals, total: result.total };
}
