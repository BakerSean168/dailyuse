/**
 * ScheduleTask Aggregate Root - Client Interface
 * 调度任务聚合根 - 客户端接口
 *
 * Residual 831: ScheduleTaskClientDTO dual retired — sole ScheduleTaskResponseSchema + z.infer.
 */

import type { z } from 'zod';
import { ScheduleTaskResponseSchema } from '../api/response-schemas';

// Residual 831: ScheduleTaskClientDTO dual retired — OpenAPI + transport use ScheduleTaskResponseSchema.
export type ScheduleTaskClientDTO = z.infer<typeof ScheduleTaskResponseSchema>;
