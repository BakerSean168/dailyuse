import { useRef } from 'react';

import { GoalClientService } from '@dailyuse/goal/application-client';
import { createGoalHttpAdapters } from '@dailyuse/goal/infrastructure-client';

import { useAppApiClient } from './use-app-api-client';

export function useGoalService() {
  const apiClient = useAppApiClient();
  const serviceRef = useRef<GoalClientService | null>(null);

  if (!serviceRef.current) {
    const adapters = createGoalHttpAdapters(apiClient);
    serviceRef.current = new GoalClientService(adapters.goal, adapters.folder, adapters.focus);
  }

  return serviceRef.current;
}
