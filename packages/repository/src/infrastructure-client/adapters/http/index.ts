/**
 * Repository HTTP Adapters - Registration
 */

import type { IHttpClient } from '../types';
import { RepositoryHttpAdapter } from './repository-http.adapter';

export { RepositoryHttpAdapter } from './repository-http.adapter';

export interface RepositoryHttpAdapters {
  repository: RepositoryHttpAdapter;
}

export function createRepositoryHttpAdapters(httpClient: IHttpClient): RepositoryHttpAdapters {
  return { repository: new RepositoryHttpAdapter(httpClient) };
}
