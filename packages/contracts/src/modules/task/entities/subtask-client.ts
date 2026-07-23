/**
 * Subtask Entity - Client Interface
 *
 * Residual 841: SubtaskClientDTO dual retired — sole SubtaskResponseSchema + z.infer.
 * Residual 649 retired SubtaskServerDTO (client-only track).
 */

import type { z } from 'zod';
import { SubtaskResponseSchema } from '../api/response-schemas';

// Residual 841: SubtaskClientDTO dual retired — OpenAPI + transport use SubtaskResponseSchema.
export type SubtaskClientDTO = z.infer<typeof SubtaskResponseSchema>;
