import { useRef } from 'react';

import { AccountClientService } from '@dailyuse/account/application-client';
import { createAccountHttpAdapters } from '@dailyuse/account/infrastructure-client';

import { useAppApiClient } from './use-app-api-client';

export function useAccountService() {
  const apiClient = useAppApiClient();
  const serviceRef = useRef<AccountClientService | null>(null);

  if (!serviceRef.current) {
    const adapters = createAccountHttpAdapters(apiClient);
    serviceRef.current = new AccountClientService(adapters.account);
  }

  return serviceRef.current;
}
