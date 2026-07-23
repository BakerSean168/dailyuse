/**
 * Reminder History Entity - Client Interface
 *
 * Residual 827: ReminderHistoryClientDTO dual retired — sole ReminderHistoryResponseSchema + z.infer.
 */

import type { z } from 'zod';
import { ReminderHistoryResponseSchema } from '../api/response-schemas';

// Residual 827: ReminderHistoryClientDTO dual retired — OpenAPI + transport use ReminderHistoryResponseSchema.
export type ReminderHistoryClientDTO = z.infer<typeof ReminderHistoryResponseSchema>;
