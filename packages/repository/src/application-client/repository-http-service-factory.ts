import type { IResultHttpClient } from '@dailyuse/http-client';

import { createRepositoryHttpAdapters } from '../infrastructure-client';
import {
  RepositoryClientService,
  createRepositoryClientService,
} from './repository-client-service';

export function createRepositoryServiceFromHttpClient(
  httpClient: IResultHttpClient,
): RepositoryClientService {
  const adapters = createRepositoryHttpAdapters(httpClient);
  return createRepositoryClientService(adapters.repository);
}
