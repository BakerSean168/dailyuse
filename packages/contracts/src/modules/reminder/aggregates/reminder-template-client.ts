/**
 * Reminder Template Aggregate Root - Client Interface
 * 提醒模板聚合根 - 客户端接口
 *
 * Residual 833: ReminderTemplateClientDTO dual retired — sole ReminderTemplateResponseSchema + z.infer.
 */

import type { z } from 'zod';
import { ReminderTemplateResponseSchema } from '../api/response-schemas';

// Residual 833: ReminderTemplateClientDTO dual retired — OpenAPI + transport use ReminderTemplateResponseSchema.
export type ReminderTemplateClientDTO = z.infer<typeof ReminderTemplateResponseSchema>;
