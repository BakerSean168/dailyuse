import { useRef } from 'react';

import type { IResultHttpClient } from '@dailyuse/http-client';

import { useAppSession } from './use-app-session';

export function useAppApiClient(): IResultHttpClient {
  const { createAuthorizedHttpClient } = useAppSession();
  const clientRef = useRef<IResultHttpClient | null>(null);

  if (!clientRef.current) {
    clientRef.current = createAuthorizedHttpClient();
  }

  return clientRef.current;
}
