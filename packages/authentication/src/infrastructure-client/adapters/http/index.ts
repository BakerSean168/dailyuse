/**
 * Authentication HTTP Adapters - Registration
 */

import type { IResultHttpClient } from '@dailyuse/http-client';
import { AuthHttpAdapter } from './auth-http.adapter';

export { AuthHttpAdapter, createAuthHttpAdapter } from './auth-http.adapter';

export interface AuthHttpAdapters {
  auth: AuthHttpAdapter;
}

export function createAuthHttpAdapters(httpClient: IResultHttpClient): AuthHttpAdapters {
  return {
    auth: new AuthHttpAdapter(httpClient),
  };
}
