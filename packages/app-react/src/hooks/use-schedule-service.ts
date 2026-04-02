import { useRef } from 'react';

import { ScheduleClientService } from '@dailyuse/schedule/application-client';
import { createScheduleHttpAdapters } from '@dailyuse/schedule/infrastructure-client';

import { useAppApiClient } from './use-app-api-client';

export function useScheduleService() {
  const apiClient = useAppApiClient();
  const serviceRef = useRef<ScheduleClientService | null>(null);

  if (!serviceRef.current) {
    const adapters = createScheduleHttpAdapters(apiClient);
    serviceRef.current = new ScheduleClientService(adapters.event, adapters.task);
  }

  return serviceRef.current;
}
