import type { IResultHttpClient } from '@dailyuse/http-client';

import { createGoalHttpAdapters } from '../infrastructure-client';
import { GoalClientService, createGoalClientService } from './goal-client-service';

export function createGoalServiceFromHttpClient(httpClient: IResultHttpClient): GoalClientService {
  const adapters = createGoalHttpAdapters(httpClient);
  return createGoalClientService(adapters.goal, adapters.folder, adapters.focus);
}
