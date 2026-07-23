/**
 * FocusSession Aggregate Root - Client Interface
 * 专注周期聚合根 - 客户端接口
 *
 * Residual 813: FocusSessionClientDTO dual retired — sole FocusSessionClientDTOSchema + z.infer.
 */

import type { z } from 'zod';
import { FocusSessionClientDTOSchema } from '../api/response-schemas';

// Residual 813: FocusSessionClientDTO dual retired — OpenAPI + transport use FocusSessionClientDTOSchema.
export type FocusSessionClientDTO = z.infer<typeof FocusSessionClientDTOSchema>;
