/**
 * NotificationTemplate Aggregate Root - Client Interface
 *
 * Residual 839: NotificationTemplateClientDTO dual retired — sole NotificationTemplateResponseSchema + z.infer.
 */

import type { z } from 'zod';
import { NotificationTemplateResponseSchema } from '../api/response-schemas';

// Residual 839: NotificationTemplateClientDTO dual retired — OpenAPI + transport use NotificationTemplateResponseSchema.
export type NotificationTemplateClientDTO = z.infer<typeof NotificationTemplateResponseSchema>;
