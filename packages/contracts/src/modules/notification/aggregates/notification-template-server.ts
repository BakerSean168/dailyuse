/**
 * NotificationTemplate Aggregate Root - Server Interface
 *
 * Residual 845: NotificationTemplateServerDTO dual retired — sole NotificationTemplateResponseSchema + z.infer
 * (same schema as NotificationTemplateClientDTO; identical shape).
 */

import type { z } from 'zod';
import { NotificationTemplateResponseSchema } from '../api/response-schemas';

// Residual 845: NotificationTemplateServerDTO dual retired — shared NotificationTemplateResponseSchema with client.
export type NotificationTemplateServerDTO = z.infer<typeof NotificationTemplateResponseSchema>;
