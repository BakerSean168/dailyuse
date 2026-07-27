/**
 * RecurrenceRule Value Object - Server Interface
 */

// Ensure Zod.openapi() is available before schema construction (residual 1331).
import '../../../primitives/zod-extensions';
import { z } from 'zod';
import type { Instant } from '../../../primitives';
import { DayOfWeek } from './day-of-week';
import { RecurrenceFrequency } from './recurrence-frequency';

// ============ Interface Definitions ============

/** Recurrence rule interface. */
export interface RecurrenceRule {
  frequency: RecurrenceFrequency;
  interval: number; // Interval (e.g. every 2 days, every 3 weeks)
  daysOfWeek: DayOfWeek[]; // Days of week (used for WEEKLY frequency)
  /** ADR-037: Instant epoch ms of end calendar moment */
  endDate: Instant | null;
  occurrences: number | null; // Number of occurrences
}

// Residual 743: RecurrenceRuleDTO dual body retired — OpenAPI + transport use
// RecurrenceConfigSchema (semantic type is a z.infer alias).

const DayOfWeekSchema = z.union([
  z.literal(DayOfWeek.Sunday),
  z.literal(DayOfWeek.Monday),
  z.literal(DayOfWeek.Tuesday),
  z.literal(DayOfWeek.Wednesday),
  z.literal(DayOfWeek.Thursday),
  z.literal(DayOfWeek.Friday),
  z.literal(DayOfWeek.Saturday),
]);

export const RecurrenceConfigSchema = z
  .object({
    frequency: z.enum([
      RecurrenceFrequency.Daily,
      RecurrenceFrequency.Weekly,
      RecurrenceFrequency.Monthly,
      RecurrenceFrequency.Yearly,
    ]),
    interval: z.number().int().positive(),
    daysOfWeek: z.array(DayOfWeekSchema),
    endDate: z.number().int().nullable(),
    occurrences: z.number().int().positive().nullable(),
  })
  .superRefine((candidate, ctx) => {
    if (candidate.endDate != null && candidate.occurrences != null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: '重复规则不能同时设置结束日期和重复次数',
      });
    }
  })
  .openapi({ type: 'object', description: '循环规则配置' });

export type RecurrenceRuleDTO = z.infer<typeof RecurrenceConfigSchema>;
export type RecurrenceConfigReq = z.infer<typeof RecurrenceConfigSchema>;
