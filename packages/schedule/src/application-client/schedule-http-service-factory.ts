import type { IResultHttpClient } from '@dailyuse/http-client';

import { createScheduleHttpAdapters } from '../infrastructure-client';
import { ScheduleClientService, createScheduleClientService } from './schedule-client-service';

export function createScheduleServiceFromHttpClient(
  httpClient: IResultHttpClient,
): ScheduleClientService {
  const adapters = createScheduleHttpAdapters(httpClient);
  return createScheduleClientService(adapters.event, adapters.task);
}
