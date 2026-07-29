import type { IResultHttpClient } from '@memoflow/http-client';

import { useAppClientRegistry } from '../providers/app-client-registry-provider';

export function useAppApiClient(): IResultHttpClient {
  return useAppClientRegistry().httpClient;
}
