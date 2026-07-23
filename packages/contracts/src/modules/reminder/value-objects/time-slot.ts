/**
 * Time Slot Value Object
 * 时间段（用于记录最佳/最差响应时间段）
 */

import { z } from 'zod';

// Residual 751: TimeSlotDTO dual body retired — OpenAPI + transport use
// TimeSlotSchema (semantic type is a z.infer alias).

export const TimeSlotSchema = z.object({
  hourStart: z.number(),
  hourEnd: z.number(),
  avgResponseRate: z.number(),
  sampleCount: z.number(),
});

export type TimeSlotDTO = z.infer<typeof TimeSlotSchema>;
