/**
 * Schedule Config Value Object
 */

import { z } from 'zod';
import type { Timezone } from './timezone';
import { Timezone as TimezoneEnum } from './timezone';

// ============ Interface Definitions ============

/** Schedule config interface. */
export interface IScheduleConfig {
  /** Cron expression */
  cronExpression: string | null;

  /** Timezone */
  timezone: Timezone;

  /** Start date (optional, null means start immediately) */
  startDate: number | null;

  /** End date (optional, null means never ends) */
  endDate: number | null;

  /** Maximum execution count (optional, null means unlimited) */
  maxExecutions: number | null;

  // Value object methods
  with(
    updates: Partial<
      Omit<
        IScheduleConfig,
        | 'equals'
        | 'with'
        | 'calculateNextRun'
        | 'isExpired'
        | 'toDTO'
      >
    >,
  ): IScheduleConfig;

  // DTO conversion methods
}

// Residual 749: ScheduleConfigDTO dual body retired — OpenAPI response transport uses
// ScheduleConfigSchema (semantic type is a z.infer alias). Request schemas stay local
// (different field types / validation). Domain IScheduleConfig keeps number dates.

export const ScheduleConfigSchema = z.object({
  cronExpression: z.string().nullable(),
  timezone: z.enum(TimezoneEnum),
  startDate: z.string().nullable(),
  endDate: z.string().nullable(),
  maxExecutions: z.number().nullable(),
});

export type ScheduleConfigDTO = z.infer<typeof ScheduleConfigSchema>;
