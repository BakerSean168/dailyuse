import type { IResultHttpClient } from '@dailyuse/http-client';

import { useAppClientRegistry } from '../providers/app-client-registry-provider';

export function useAppApiClient(): IResultHttpClient {
  return useAppClientRegistry().httpClient;
}
