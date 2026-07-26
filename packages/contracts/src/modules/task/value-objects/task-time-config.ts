/**
 * TaskTimeConfig Value Object - Server Interface
 *
 * ADR-037: startDate is Instant (epoch ms of the calendar anchor), not DomainDate.
 * All-day calendar day is exposed as startDay: Ymd on the domain VO.
 */

// Ensure Zod.openapi() is available before schema construction (residual 1331).
import '../../../primitives/zod-extensions';
import { z } from 'zod';
import type { Instant, Ymd } from '../../../primitives';
import { TaskTimeType } from './task-time-type';

// ============ Interface Definitions ============

export interface TaskTimeConfig {
  timeType: TaskTimeType;
  /** Instantaneous anchor for the task day (local midnight Instant of start day). */
  startDate: Instant | null;
  /** Calendar day for all-day / day-anchored tasks (derived or stored). */
  startDay?: Ymd | null;
  timePoint: number | null;
  timeRange?: { start: number; end: number } | null;
}

// Residual 747: TaskTimeConfigDTO dual body retired — OpenAPI + transport use
// TaskTimeConfigSchema. Domain startDate is Instant (no DomainDate Date dual).

export const TaskTimeConfigSchema = z
  .object({
    timeType: z.enum([TaskTimeType.AllDay, TaskTimeType.TimePoint, TaskTimeType.TimeRange]),
    startDate: z.number().int().nullable(),
    timePoint: z.number().int().nullable(),
    timeRange: z
      .object({
        start: z.number().int(),
        end: z.number().int(),
      })
      .nullable()
      .optional(),
  })
  .superRefine((value, ctx) => {
    if (value.timeType === TaskTimeType.TimePoint && value.timePoint == null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['timePoint'],
        message: '时间点任务必须提供 timePoint',
      });
    }

    if (value.timeType === TaskTimeType.TimeRange) {
      if (!value.timeRange) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['timeRange'],
          message: '时间段任务必须提供 timeRange',
        });
      } else if (value.timeRange.start >= value.timeRange.end) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['timeRange'],
          message: 'timeRange.start 必须小于 timeRange.end',
        });
      }
    }
  })
  .openapi({ type: 'object', description: '任务时间配置' });

export type TaskTimeConfigDTO = z.infer<typeof TaskTimeConfigSchema>;
export type TaskTimeConfigReq = z.infer<typeof TaskTimeConfigSchema>;
