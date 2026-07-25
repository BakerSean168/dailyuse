/**
 * ScheduleExecution Entity - Client Interface
 * 调度执行记录实体 - 客户端接口
 *
 * Residual 833: ScheduleExecutionClientDTO dual retired — sole ScheduleExecutionResponseSchema + z.infer.
 */

import type { z } from 'zod';
import { ScheduleExecutionResponseSchema } from '../api/response-schemas';

// Residual 833: ScheduleExecutionClientDTO dual retired — OpenAPI + transport use ScheduleExecutionResponseSchema.
export type ScheduleExecutionClientDTO = z.infer<typeof ScheduleExecutionResponseSchema>;
