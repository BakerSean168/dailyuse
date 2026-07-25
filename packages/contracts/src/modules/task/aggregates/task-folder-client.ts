/**
 * TaskFolder Aggregate Root - Client Interface
 *
 * Residual 837: TaskFolderClientDTO dual retired — sole TaskFolderResponseSchema + z.infer.
 */

import type { z } from 'zod';
import { TaskFolderResponseSchema } from '../api/response-schemas';

// Residual 837: TaskFolderClientDTO dual retired — OpenAPI + transport use TaskFolderResponseSchema.
export type TaskFolderClientDTO = z.infer<typeof TaskFolderResponseSchema>;
