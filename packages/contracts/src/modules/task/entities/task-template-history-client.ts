/**
 * TaskTemplateHistory Entity - Client Interface
 *
 * Residual 837: TaskTemplateHistoryClientDTO dual retired — sole TaskTemplateHistoryResponseSchema + z.infer.
 */

import type { z } from 'zod';
import { TaskTemplateHistoryResponseSchema } from '../api/response-schemas';

// Residual 837: TaskTemplateHistoryClientDTO dual retired — OpenAPI + transport use TaskTemplateHistoryResponseSchema.
export type TaskTemplateHistoryClientDTO = z.infer<typeof TaskTemplateHistoryResponseSchema>;
