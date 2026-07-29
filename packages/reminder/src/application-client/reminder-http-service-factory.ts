import type { IResultHttpClient } from '@memoflow/http-client';

import { createReminderHttpAdapters } from '../infrastructure-client';
import { ReminderClientService, createReminderClientService } from './reminder-client-service';

export function createReminderServiceFromHttpClient(
  httpClient: IResultHttpClient,
): ReminderClientService {
  const adapters = createReminderHttpAdapters(httpClient);
  return createReminderClientService(adapters.reminder);
}
