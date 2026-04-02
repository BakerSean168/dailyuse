import { useRef } from 'react';

import { NotificationClientService } from '@dailyuse/notification/application-client';
import { createNotificationHttpAdapters } from '@dailyuse/notification/infrastructure-client';

import { useAppApiClient } from './use-app-api-client';

export function useNotificationService() {
  const apiClient = useAppApiClient();
  const serviceRef = useRef<NotificationClientService | null>(null);

  if (!serviceRef.current) {
    const adapters = createNotificationHttpAdapters(apiClient);
    serviceRef.current = new NotificationClientService(adapters.notification);
  }

  return serviceRef.current;
}
