/**
 * Authentication HTTP Adapters - Registration
 */

import type { IHttpClient } from '../types';
import { AuthHttpAdapter } from './auth-http.adapter';

export { AuthHttpAdapter, createAuthHttpAdapter } from './auth-http.adapter';

export interface AuthHttpAdapters {
  auth: AuthHttpAdapter;
}

export function createAuthHttpAdapters(httpClient: IHttpClient): AuthHttpAdapters {
  return {
    auth: new AuthHttpAdapter(httpClient),
  };
}
