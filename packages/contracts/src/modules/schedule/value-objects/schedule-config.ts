/**
 * Schedule Config Value Object
 */

import type { Timezone } from './timezone';

// ============ Interface Definitions ============

/** Schedule config - Server interface. */
export interface IScheduleConfigServer {
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
        IScheduleConfigServer,
        | 'equals'
        | 'with'
        | 'calculateNextRun'
        | 'isExpired'
        | 'toServerDTO'
        | 'toClientDTO'
        | 'toPersistenceDTO'
      >
    >,
  ): IScheduleConfigServer;

  // DTO conversion methods
}

/** Schedule config - Client interface. */
export interface IScheduleConfigClient {
  /** Cron expression */
  cronExpression: string | null;

  /** Timezone */
  timezone: Timezone;

  /** Start date */
  startDate: Date | null;

  /** End date */
  endDate: Date | null;

  /** Maximum execution count */
  maxExecutions: number | null;

  // UI helper properties
  /** Human-readable cron description */
  cronDescription: string; // "Daily at 9:00"

  /** Timezone display name */
  timezoneDisplay: string; // "Shanghai (UTC+8)"

  /** Formatted start date */
  startDateFormatted: string | null; // "2025-01-01 09:00"

  /** Formatted end date */
  endDateFormatted: string | null;

  /** Formatted max executions */
  maxExecutionsFormatted: string; // "Unlimited" | "100 times"

  // Value object methods

  // DTO conversion methods
}

// ============ DTO Definitions ============

/**
 * Schedule Config Server DTO
 */
export interface ScheduleConfigServerDTO {
  cronExpression: string | null;
  timezone: Timezone;
  startDate: string | null; // ISO string
  endDate: string | null;
  maxExecutions: number | null;
}

/**
 * Schedule Config Client DTO
 */
export interface ScheduleConfigClientDTO {
  cronExpression: string | null;
  timezone: Timezone;
  startDate: string | null;
  endDate: string | null;
  maxExecutions: number | null;
  cronDescription: string;
  timezoneDisplay: string;
  startDateFormatted: string | null;
  endDateFormatted: string | null;
  maxExecutionsFormatted: string;
}

/**
 * Schedule Config Persistence DTO
 */
export interface ScheduleConfigPersistenceDTO {
  cronExpression: string | null;
  timezone: string;
  startDate: string | null;
  endDate: string | null;
  maxExecutions: number | null;
}

// ============ Type Exports ============

export type ScheduleConfigServer = IScheduleConfigServer;
export type ScheduleConfigClient = IScheduleConfigClient;
