/**
 * Schedule Config Value Object
 */

import type { Timezone } from './timezone';

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

// ============ DTO Definitions ============

/**
 * Schedule Config DTO
 */
export interface ScheduleConfigDTO {
  cronExpression: string | null;
  timezone: Timezone;
  startDate: string | null; // ISO string
  endDate: string | null;
  maxExecutions: number | null;
}
