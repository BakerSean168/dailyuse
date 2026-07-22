/**
 * Reminder Client Port — application-facing reminder surface.
 *
 * Identical to IReminderApiClient for this module (pure Result pass-through).
 */

import type { IReminderApiClient } from './ports/reminder-api-client.port';

export type ReminderClientPort = IReminderApiClient;
