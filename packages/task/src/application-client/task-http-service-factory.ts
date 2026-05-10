import type { IResultHttpClient } from '@dailyuse/http-client';

import { createTaskHttpAdapters } from '../infrastructure-client';
import { TaskClientService, createTaskClientService } from './task-client-service';

export function createTaskServiceFromHttpClient(httpClient: IResultHttpClient): TaskClientService {
  const adapters = createTaskHttpAdapters(httpClient);
  return createTaskClientService(adapters.template, adapters.instance, adapters.dependency);
}
