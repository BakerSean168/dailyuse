/**
 * TaskTimeConfig Value Object - Server Interface
 */

import { z } from 'zod';
import type { DomainDate } from '../../../primitives';
import { TaskTimeType } from './task-time-type';

// ============ Interface Definitions ============

export interface TaskTimeConfig {
  timeType: TaskTimeType;
  startDate: DomainDate | null;
  timePoint: number | null;
  timeRange?: { start: number; end: number } | null;
}

// Residual 747: TaskTimeConfigDTO dual body retired — OpenAPI + transport use
// TaskTimeConfigSchema (semantic type is a z.infer alias). Domain TaskTimeConfig
// keeps DomainDate startDate (shape intentionally differs from transfer DTO).

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
