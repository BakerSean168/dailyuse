/**
 * TaskFolder Aggregate Root - Server Interface
 *
 * Residual 843: TaskFolderServerDTO dual retired — sole TaskFolderResponseSchema + z.infer
 * (same schema as TaskFolderClientDTO; identical shape).
 */

import type { z } from 'zod';
import { TaskFolderResponseSchema } from '../api/response-schemas';

// Residual 843: TaskFolderServerDTO dual retired — shared TaskFolderResponseSchema with client.
export type TaskFolderServerDTO = z.infer<typeof TaskFolderResponseSchema>;
