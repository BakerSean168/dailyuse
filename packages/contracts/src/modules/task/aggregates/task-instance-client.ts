/**
 * TaskInstance Aggregate Root - Client Interface
 *
 * Residual 831: TaskInstanceClientDTO dual retired — sole TaskInstanceResponseSchema + z.infer.
 */

import type { z } from 'zod';
import { TaskInstanceResponseSchema } from '../api/response-schemas';

// Residual 831: TaskInstanceClientDTO dual retired — OpenAPI + transport use TaskInstanceResponseSchema.
export type TaskInstanceClientDTO = z.infer<typeof TaskInstanceResponseSchema>;
