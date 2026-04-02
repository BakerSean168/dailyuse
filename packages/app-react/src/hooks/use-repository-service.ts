import { useRef } from 'react';

import { RepositoryClientService } from '@dailyuse/repository/application-client';
import { createRepositoryHttpAdapters } from '@dailyuse/repository/infrastructure-client';

import { useAppApiClient } from './use-app-api-client';

export function useRepositoryService() {
  const apiClient = useAppApiClient();
  const serviceRef = useRef<RepositoryClientService | null>(null);

  if (!serviceRef.current) {
    const adapters = createRepositoryHttpAdapters(apiClient);
    serviceRef.current = new RepositoryClientService(adapters.repository);
  }

  return serviceRef.current;
}
