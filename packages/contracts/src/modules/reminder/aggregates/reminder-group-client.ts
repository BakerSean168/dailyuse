/**
 * Reminder Group Aggregate Root - Client Interface
 * 提醒分组聚合根 - 客户端接口
 *
 * Residual 827: ReminderGroupClientDTO dual retired — sole ReminderGroupResponseSchema + z.infer.
 */

import type { z } from 'zod';
import { ReminderGroupResponseSchema } from '../api/response-schemas';

// Residual 827: ReminderGroupClientDTO dual retired — OpenAPI + transport use ReminderGroupResponseSchema.
export type ReminderGroupClientDTO = z.infer<typeof ReminderGroupResponseSchema>;
