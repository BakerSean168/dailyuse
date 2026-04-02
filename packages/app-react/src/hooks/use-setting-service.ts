import { useRef } from 'react';

import { SettingClientService } from '@dailyuse/setting/application-client';
import { createSettingHttpAdapters } from '@dailyuse/setting/infrastructure-client';

import { useAppApiClient } from './use-app-api-client';

export function useSettingService() {
  const apiClient = useAppApiClient();
  const serviceRef = useRef<SettingClientService | null>(null);

  if (!serviceRef.current) {
    const adapters = createSettingHttpAdapters(apiClient);
    serviceRef.current = new SettingClientService(adapters.setting);
  }

  return serviceRef.current;
}
