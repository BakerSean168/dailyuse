/**
 * Recurrence Config Value Object
 */

import type { RecurrenceType } from './recurrence-type';
import type { WeekDay } from './week-day';

// ============ Sub-config Interfaces ============

/** Daily recurrence configuration. */
export interface DailyRecurrence {
  /** Every N days */
  interval: number;
}

/** Weekly recurrence configuration. */
export interface WeeklyRecurrence {
  /** Every N weeks */
  interval: number;
  /** Days of the week */
  weekDays: WeekDay[];
}

/** Custom dates recurrence configuration. */
export interface CustomDaysRecurrence {
  /** Specified date list (epoch ms) */
  dates: number[];
}

// ============ Interface Definitions ============

/** Recurrence config - Server interface. */
export interface IRecurrenceConfigServer {
  type: RecurrenceType;
  daily: DailyRecurrence | null;
  weekly: WeeklyRecurrence | null;
  customDays: CustomDaysRecurrence | null;

  // Value object methods
  with(
    updates: Partial<
      Omit<
        IRecurrenceConfigServer,
        'equals' | 'with' | 'toServerDTO' | 'toClientDTO' | 'toPersistenceDTO'
      >
    >,
  ): IRecurrenceConfigServer;

  // DTO conversion methods
}

/** Recurrence config - Client interface. */
export interface IRecurrenceConfigClient {
  type: RecurrenceType;
  daily: DailyRecurrence | null;
  weekly: WeeklyRecurrence | null;
  customDays: CustomDaysRecurrence | null;

  // UI helper properties
  displayText: string; // "Daily" | "Mon, Wed, Fri" | "Custom dates"

  // Value object methods

  // DTO conversion methods
}

// ============ DTO Definitions ============

/**
 * Recurrence Config Server DTO
 */
export interface RecurrenceConfigServerDTO {
  type: RecurrenceType;
  daily: DailyRecurrence | null;
  weekly: WeeklyRecurrence | null;
  customDays: CustomDaysRecurrence | null;
}

/**
 * Recurrence Config Client DTO
 */
export interface RecurrenceConfigClientDTO {
  type: RecurrenceType;
  daily: DailyRecurrence | null;
  weekly: WeeklyRecurrence | null;
  customDays: CustomDaysRecurrence | null;
  displayText: string;
}

/**
 * Recurrence Config Persistence DTO
 */
export interface RecurrenceConfigPersistenceDTO {
  type: RecurrenceType;
  daily: string | null; // JSON string
  weekly: string | null; // JSON string
  custom_days: string | null; // JSON string
}

// ============ Type Exports ============

export type RecurrenceConfigServer = IRecurrenceConfigServer;
export type RecurrenceConfigClient = IRecurrenceConfigClient;
