/**
 * TaskTemplateHistory Entity - Server Interface
 *
 * Residual 843: TaskTemplateHistoryServerDTO dual retired — sole TaskTemplateHistoryResponseSchema + z.infer
 * (same schema as TaskTemplateHistoryClientDTO; identical shape).
 */

import type { z } from 'zod';
import { TaskTemplateHistoryResponseSchema } from '../api/response-schemas';

// Residual 843: TaskTemplateHistoryServerDTO dual retired — shared TaskTemplateHistoryResponseSchema with client.
export type TaskTemplateHistoryServerDTO = z.infer<typeof TaskTemplateHistoryResponseSchema>;
