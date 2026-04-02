import { useRef } from 'react';

import { ReminderClientService } from '@dailyuse/reminder/application-client';
import { createReminderHttpAdapters } from '@dailyuse/reminder/infrastructure-client';

import { useAppApiClient } from './use-app-api-client';

export function useReminderService() {
  const apiClient = useAppApiClient();
  const serviceRef = useRef<ReminderClientService | null>(null);

  if (!serviceRef.current) {
    const adapters = createReminderHttpAdapters(apiClient);
    serviceRef.current = new ReminderClientService(adapters.reminder);
  }

  return serviceRef.current;
}
