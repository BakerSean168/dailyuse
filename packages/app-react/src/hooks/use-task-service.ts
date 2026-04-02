import { useRef } from 'react';

import { TaskClientService } from '@dailyuse/task/application-client';
import { createTaskHttpAdapters } from '@dailyuse/task/infrastructure-client';

import { useAppApiClient } from './use-app-api-client';

export function useTaskService() {
  const apiClient = useAppApiClient();
  const serviceRef = useRef<TaskClientService | null>(null);

  if (!serviceRef.current) {
    const adapters = createTaskHttpAdapters(apiClient);
    serviceRef.current = new TaskClientService(adapters.template, adapters.instance, adapters.dependency);
  }

  return serviceRef.current;
}
