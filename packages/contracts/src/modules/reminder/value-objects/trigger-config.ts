/**
 * Trigger Config Value Object
 */

import type { TriggerType } from './trigger-type';

// ============ Sub-config Interfaces ============

/** Fixed-time trigger configuration. */
export interface FixedTimeTrigger {
  /** Time in "HH:mm" format (e.g. "09:00") */
  time: string;
  /** Timezone (optional, defaults to user timezone) */
  timezone: string | null;
}

/** Interval trigger configuration. */
export interface IntervalTrigger {
  /** Every N minutes */
  minutes: number;
  /** Start time (epoch ms, optional) */
  startTime: number | null;
}

// ============ Interface Definitions ============

/** Trigger config - Server interface. */
export interface ITriggerConfigServer {
  type: TriggerType;
  fixedTime: FixedTimeTrigger | null;
  interval: IntervalTrigger | null;

  // Value object methods
  with(
    updates: Partial<
      Omit<
        ITriggerConfigServer,
        'equals' | 'with' | 'toServerDTO' | 'toClientDTO' | 'toPersistenceDTO'
      >
    >,
  ): ITriggerConfigServer;

  // DTO conversion methods
}

/** Trigger config - Client interface. */
export interface ITriggerConfigClient {
  type: TriggerType;
  fixedTime: FixedTimeTrigger | null;
  interval: IntervalTrigger | null;

  // UI helper properties
  displayText: string; // "Daily at 09:00" | "Every 30 minutes"

  // Value object methods

  // DTO conversion methods
}

// ============ DTO Definitions ============

/**
 * Trigger Config Server DTO
 */
export interface TriggerConfigServerDTO {
  type: TriggerType;
  fixedTime: FixedTimeTrigger | null;
  interval: IntervalTrigger | null;
}

/**
 * Trigger Config Client DTO
 */
export interface TriggerConfigClientDTO {
  type: TriggerType;
  fixedTime: FixedTimeTrigger | null;
  interval: IntervalTrigger | null;
  displayText: string;
}

/**
 * Trigger Config Persistence DTO
 */
export interface TriggerConfigPersistenceDTO {
  type: TriggerType;
  fixed_time: string | null; // JSON string
  interval: string | null; // JSON string
}

// ============ Type Exports ============

export type TriggerConfigServer = ITriggerConfigServer;
export type TriggerConfigClient = ITriggerConfigClient;
